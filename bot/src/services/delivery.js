import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { prisma, getSetting } from '../prisma.js';
import { shopEmbed } from '../utils/embeds.js';
import { config } from '../config.js';

async function notifyAdmin(message) {
  const guild = global.client?.guilds?.cache?.first();
  const adminChannelId = await getSetting('adminChannelId');
  if (!guild || !adminChannelId) return;
  const channel = guild.channels.cache.get(adminChannelId);
  if (channel) channel.send(message).catch(() => {});
}

// Récupère le stock disponible pour un produit (si le produit a du stock).
async function takeStock(order, product) {
  const item = await prisma.stockItem.findFirst({
    where: { productId: product.id, isSold: false },
    orderBy: { createdAt: 'asc' },
  });
  if (!item) return null;
  await prisma.stockItem.update({
    where: { id: item.id },
    data: { isSold: true, soldAt: new Date(), orderId: order.id },
  });
  return item.data;
}

// Livre la commande : envoie le produit en DM, attribue le rôle, met à jour la base.
export async function deliverOrder(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { product: true },
  });
  if (!order) return { ok: false, error: 'Commande introuvable' };
  if (order.status === 'DELIVERED') return { ok: true };

  const product = order.product;

  // Prend un article du stock
  const itemData = await takeStock(order, product);
  if (!itemData) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'FAILED' },
    });
    await notifyAdmin(`⚠️ Commande **${order.id}** : rupture de stock pour **${product.name}**.`);
    return { ok: false, error: 'Rupture de stock' };
  }

  const content = itemData + (product.deliveryNote ? `\n\n📝 ${product.deliveryNote}` : '');

  // Sauvegarde la livraison
  await prisma.delivery.create({
    data: { orderId: order.id, content },
  });

  const member = await resolveMember(order.userId);

  // Envoi en DM
  const dmSent = await sendDeliveryDm(member, product, content, order);

  // Attribution du rôle
  let roleAssigned = false;
  if (product.roleId && member) {
    try {
      await member.roles.add(product.roleId);
      roleAssigned = true;
    } catch {
      /* rôle introuvable / permission */
    }
  }

  // Mise à jour de la commande
  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'DELIVERED',
      deliveredAt: new Date(),
    },
  });

  await notifyAdmin(
    `✅ Commande **${order.id}** livrée pour **${order.userName || 'acheteur'}** (${product.name})`
  );

  return { ok: true, dmSent, roleAssigned };
}

async function resolveMember(userId) {
  const guild = global.client?.guilds?.cache?.first();
  if (!guild) return null;
  try {
    return await guild.members.fetch(userId);
  } catch {
    return null;
  }
}

async function sendDeliveryDm(member, product, content, order) {
  const embed = shopEmbed(
    '🎉 Produit livré !',
    `Merci pour ton achat **${product.name}** !\nVoici ton produit :`,
    product.color
  )
    .addFields({ name: '📦 Contenu', value: content })
    .addFields({ name: '🆔 Commande', value: order.id });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('Ouvrir un ticket si problème')
      .setStyle(ButtonStyle.Secondary)
      .setCustomId('open_ticket')
  );

  if (member?.send) {
    try {
      await member.send({ embeds: [embed], components: [row] });
      return true;
    } catch {
      /* DMs fermés - on log dans le salon admin */
    }
  }
  await notifyAdmin(`ℹ️ Commande **${order.id}** livrée mais **DMs fermés** pour ${order.userName}. Contenu:\n\`\`\`${content}\`\`\``);
  return false;
}

// Envoie les instructions de paiement à l'acheteur
export async function sendPaymentInstructions(member, order, product) {
  let content;
  if (order.paymentMethod === 'LITECOIN' && order.payAddress) {
    content =
      `**${product.name}** — **$${Number(order.amount).toFixed(2)}**\n\n` +
      `Envoie exactement **${order.payAmount} LTC** à cette adresse :\n` +
      `\`\`\`${order.payAddress}\`\`\`\n` +
      (config.panelUrl ? `Suis ta commande ici : ${config.panelUrl}/suivi/${order.id}\n\n` : `\n`) +
      `⏳ La livraison est **automatique** dès confirmation du paiement sur le réseau Litecoin.`;
  } else if (order.paymentMethod === 'PAYPAL') {
    content =
      `**${product.name}** — **$${Number(order.amount).toFixed(2)}**\n\n` +
      `Paye via ce lien PayPal : ${config.paypalMe ? `https://www.paypal.me/${config.paypalMe}/${Number(order.amount).toFixed(2)}` : 'paypal.me non configuré'}\n\n` +
      `Après le paiement, **colle l'ID de transaction** ici (ou envoie la capture d'écran) — un vendeur validera manuellement ta commande.`;
  } else {
    content = 'Méthode de paiement inconnue. Contacte le support.';
  }

  const embed = shopEmbed('💳 Paiement requis', content, product.color)
    .addFields({ name: '🆔 Commande', value: order.id, inline: true })
    .addFields({ name: '📦 Produit', value: product.name, inline: true })
    .addFields({ name: '💰 Prix', value: `$${Number(order.amount).toFixed(2)}`, inline: true });

  if (member?.send) {
    try {
      await member.send({ embeds: [embed] });
    } catch {
      /* ignore */
    }
  }
}

// Ferme et supprime proprement un ticket
export async function closeTicket(channelId, reason = 'Ticket fermé') {
  const ticket = await prisma.ticket.findUnique({ where: { channelId } });
  if (!ticket) return { ok: false, error: 'Ticket introuvable' };
  if (ticket.status === 'CLOSED') return { ok: true };

  const guild = global.client?.guilds?.cache?.first();
  const channel = guild?.channels?.cache?.get(channelId);

  if (channel) {
    const embed = shopEmbed('🔒 Ticket fermé', reason);
    await channel.send({ embeds: [embed] }).catch(() => {});
  }

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { status: 'CLOSED', closedAt: new Date() },
  });

  // Suppression différée du salon
  setTimeout(async () => {
    try {
      await channel?.delete();
    } catch {
      /* déjà supprimé */
    }
  }, 5000);

  return { ok: true };
}
import { prisma, getSetting, setSetting } from '../prisma.js';
import { shopEmbed } from '../utils/embeds.js';
import { addSpend } from './leaderboard.js';
import { updateProductsEmbed } from './products.js';

// Envoie (ou renvoie) l'embed du tutoriel dans le salon vouch
export async function sendVouchTutorial({ channelId }) {
  const channelIdToUse = channelId || (await getSetting('vouchChannelId'));
  if (!channelIdToUse) return { ok: false, error: 'Aucun salon vouch configuré' };

  const guild = global.client?.guilds?.cache?.first();
  const channel = guild?.channels?.cache?.get(channelIdToUse);
  if (!channel) return { ok: false, error: 'Salon introuvable' };

  const title = await getSetting('vouchTutorialTitle', 'Comment poster une vouch');
  const description = await getSetting('vouchTutorialDescription');

  const embed = shopEmbed(title, description, 'f49ecd');

  const oldId = await getSetting('vouchTutorialMessageId');
  if (oldId) {
    const old = await channel.messages.fetch(oldId).catch(() => null);
    if (old) await old.delete().catch(() => {});
  }

  const sent = await channel.send({ embeds: [embed] });
  await setSetting('vouchTutorialMessageId', sent.id);
  await setSetting('vouchChannelId', channelIdToUse);
  return { ok: true };
}

// Traite un message "+vouch @user prix produit x1"
export async function handleVouch(message) {
  const vouchChannelId = await getSetting('vouchChannelId');
  if (!vouchChannelId || message.channel.id !== vouchChannelId) return;

  const match = message.content
    .trim()
    .match(/^\+vouch\s+<@!?(\d+)>\s+(\d+[\.,]\d+|\d+)\s+(.+?)\s+x(\d+)\s*$/i);
  if (!match) return;

  // Restriction par rôle : seuls les membres avec le rôle autorisé peuvent poster une vouch
  const allowedRoleId = await getSetting('vouchAllowedRoleId');
  const adminRoleId = await getSetting('adminRoleId');
  if (allowedRoleId) {
    const hasRole = message.member?.roles?.cache?.has(allowedRoleId);
    const isAdmin = adminRoleId && message.member?.roles?.cache?.has(adminRoleId);
    if (!hasRole && !isAdmin) {
      const warn = await message
        .reply({ content: `❌ Seuls les membres avec le rôle <@&${allowedRoleId}> peuvent poster une vouch.` })
        .catch(() => null);
      if (warn) setTimeout(() => warn.delete().catch(() => {}), 5000);
      await message.delete().catch(() => {});
      return;
    }
  }

  const [, targetUserId, price, product, quantity] = match;

  const target = message.guild?.members.cache.get(targetUserId);
  const targetName = target?.displayName || (await message.guild?.members.fetch(targetUserId).catch(() => null))?.displayName || targetUserId;

  // Stocke la vouch pour l'historique du panel
  await prisma.vouch
    .create({
      data: {
        messageId: message.id,
        channelId: message.channel.id,
        userId: message.author.id,
        userName: message.author.username,
        targetUserId,
        targetName,
        price: price.replace(',', '.'),
        product,
        quantity: parseInt(quantity, 10) || 1,
      },
    })
    .catch(() => {});

  // Confirmation éphémère : le bot répond puis supprime sa réponse
  const confirm = await message.reply({ content: '✅ Vouch confirmé !' }).catch(() => null);
  if (confirm) {
    setTimeout(() => confirm.delete().catch(() => {}), 3000);
  }

  // Vente automatique : le montant (prix x quantité) est ajouté au leaderboard de l'auteur,
  // et le stock du produit correspondant est décrémenté
  const amount = (parseFloat(price.replace(',', '.')) || 0) * (parseInt(quantity, 10) || 1);
  const authorName = message.member?.displayName || message.author.username;
  await addSpend({ userId: message.author.id, username: authorName, amount }).catch(() => {});
  await decrementProductStock(product.trim(), parseInt(quantity, 10) || 1).catch(() => {});

  // Réaction fleur sakura sur le message de vouch
  await message.react('🌸').catch(() => {});

  // Supprime le tutoriel et le renvoie juste en dessous de la vouch
  await sendVouchTutorial({ channelId: message.channel.id }).catch(() => {});
}

// Cherche un produit par nom (correspondance exacte puis partielle) et décrémente son stock
export async function decrementProductStock(productName, quantity) {
  const products = await prisma.product.findMany({ where: { isActive: true } });
  const norm = productName.toLowerCase();
  const product =
    products.find((p) => p.name.toLowerCase() === norm) ||
    products.find((p) => p.name.toLowerCase().includes(norm)) ||
    products.find((p) => norm.includes(p.name.toLowerCase()));
  if (!product) return { ok: true, skipped: true };

  const newStock = Math.max(0, (product.stock || 0) - quantity);
  await prisma.product.update({ where: { id: product.id }, data: { stock: newStock } });
  await updateProductsEmbed().catch(() => {});
  return { ok: true, product: product.name, stock: newStock };
}

// Supprime le message de vouch sur Discord (appelé depuis le panel)
export async function deleteVouch({ messageId, channelId }) {
  const guild = global.client?.guilds?.cache?.first();
  const channel = guild?.channels?.cache?.get(channelId);
  if (channel) {
    const msg = await channel.messages.fetch(messageId).catch(() => null);
    if (msg) await msg.delete().catch(() => {});
  }
  return { ok: true };
}
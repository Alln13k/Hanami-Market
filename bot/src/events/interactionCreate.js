import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  PermissionFlagsBits,
  ButtonStyle,
  ButtonBuilder,
} from 'discord.js';
import { prisma, getSetting } from '../prisma.js';
import { shopEmbed } from '../utils/embeds.js';
import { createLtcPayment } from '../services/payments.js';
import { sendPaymentInstructions } from '../services/delivery.js';

async function createOrder(user, product, paymentMethod) {
  return prisma.order.create({
    data: {
      productId: product.id,
      userId: user.id,
      userName: user.username,
      amount: product.price,
      paymentMethod,
      status: 'PENDING',
    },
  });
}

// Sélection d'un produit depuis /shop
async function handleProductSelect(interaction) {
  const productId = interaction.values[0];
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) {
    return interaction.update({
      embeds: [shopEmbed('❌ Produit indisponible', 'Ce produit n\'est plus disponible.')],
      components: [],
    });
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('💠 Litecoin')
      .setStyle(ButtonStyle.Success)
      .setCustomId(`pay_method_LITECOIN_${product.id}`),
    new ButtonBuilder()
      .setLabel('💳 PayPal')
      .setStyle(ButtonStyle.Primary)
      .setCustomId(`pay_method_PAYPAL_${product.id}`)
  );

  await interaction.update({
    embeds: [
      shopEmbed(
        `🛒 ${product.name}`,
        `${product.description || ''}\n\n💰 **Prix : $${Number(product.price).toFixed(2)}**\n\nChoisis ta méthode de paiement :`,
        product.color
      ),
    ],
    components: [row],
  });
}

// Choix de la méthode de paiement -> création de la commande
async function handlePaymentChoice(interaction) {
  const customId = interaction.customId; // pay_method_LITECOIN_<id> | pay_method_PAYPAL_<id>
  const [, method, productId] = customId.split('_');

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) {
    return interaction.reply({ content: '❌ Produit indisponible.', ephemeral: true });
  }

  const order = await createOrder(interaction.user, product, method);

  await interaction.update({
    embeds: [
      shopEmbed(
        '⏳ Commande créée !',
        `**${product.name}** — $${Number(product.price).toFixed(2)}\n\n` +
          `ID commande : \`${order.id}\`\n\nJe t'envoie les instructions de paiement en message privé.`,
        product.color
      ),
    ],
    components: [],
  });

  if (method === 'LITECOIN') {
    try {
      const pay = await createLtcPayment({ orderId: order.id, amountUSD: Number(product.price) });
      if (!pay) {
        return interaction.followUp({ content: '❌ Impossible de générer l\'adresse de paiement.', ephemeral: true });
      }
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentId: pay.paymentId,
          payAddress: pay.payAddress,
          payAmount: pay.payAmount,
          payCurrency: pay.payCurrency,
        },
      });
    } catch (err) {
      console.error('Erreur création paiement LTC:', err);
      return interaction.followUp({
        content: '❌ Erreur lors de la création du paiement Litecoin. Contacte le support.',
        ephemeral: true,
      });
    }
  }

  await sendPaymentInstructions(interaction.user, order, product);
}

// Ouverture d'un ticket depuis le bouton (ou depuis un DM)
async function handleOpenTicket(interaction) {
  const categoryId = await getSetting('ticketCategoryId');
  const guild = interaction.guild;

  if (!guild) {
    return interaction.reply({ content: '❌ Tu dois utiliser cette commande sur le serveur du shop.', ephemeral: true });
  }

  // Menu de choix du type de ticket
  const select = new StringSelectMenuBuilder()
    .setCustomId('ticket_type')
    .setPlaceholder('Choisis le type de ticket')
    .addOptions([
      { label: '🛒 Achat / Commande', description: 'Problème avec un achat', value: 'BUY' },
      { label: '🛠️ Support', description: 'Besoin d\'aide', value: 'SUPPORT' },
      { label: '📦 Autre', description: 'Autre demande', value: 'OTHER' },
    ]);

  await interaction.reply({
    embeds: [shopEmbed('🎫 Nouveau ticket', 'Choisis le type de ticket :')],
    components: [new ActionRowBuilder().addComponents(select)],
    ephemeral: false,
  });
}

// Choix du type de ticket -> création du salon
async function handleTicketType(interaction) {
  const type = interaction.values[0];
  const guild = interaction.guild;
  const categoryId = await getSetting('ticketCategoryId');
  const adminRoleId = await getSetting('adminRoleId');

  const existing = await prisma.ticket.findFirst({
    where: { userId: interaction.user.id, status: 'OPEN' },
  });
  if (existing) {
    return interaction.update({
      embeds: [shopEmbed('⚠️ Ticket déjà ouvert', `Tu as déjà un ticket ouvert : <#${existing.channelId}>`)],
      components: [],
    });
  }

  const channel = await guild.channels.create({
    name: `ticket-${interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    type: ChannelType.GuildText,
    parent: categoryId || undefined,
    permissionOverwrites: [
      {
        id: guild.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: interaction.user.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
      },
      ...(adminRoleId
        ? [{ id: adminRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }]
        : []),
    ],
  });

  const ticket = await prisma.ticket.create({
    data: {
      channelId: channel.id,
      userId: interaction.user.id,
      userName: interaction.user.username,
      type,
      status: 'OPEN',
    },
  });

  const typeLabel = { BUY: '🛒 Achat', SUPPORT: '🛠️ Support', OTHER: '📦 Autre' }[type] || type;

  const closeRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel('🔒 Fermer le ticket').setStyle(ButtonStyle.Danger).setCustomId('close_ticket')
  );

  await channel.send({
    embeds: [
      shopEmbed(
        `🎫 Ticket ${typeLabel}`,
        `Bienvenue <@${interaction.user.id}> !\nUn membre du staff va te répondre. Décris ton problème.\n\nID ticket : \`${ticket.id}\``
      ),
    ],
    components: [closeRow],
  });

  await interaction.update({
    embeds: [shopEmbed('✅ Ticket créé', `Ton ticket : <#${channel.id}>`)],
    components: [],
  });
}

// Fermeture d'un ticket depuis le bouton
async function handleCloseTicket(interaction) {
  const { closeTicket } = await import('../services/delivery.js');
  const result = await closeTicket(interaction.channel.id, 'Ticket fermé par le staff.');
  if (result.ok) {
    await interaction.reply({ content: '🔒 Ticket fermé, il sera supprimé dans quelques secondes.', ephemeral: true });
  }
}

export async function handleInteraction(interaction) {
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'select_product') return handleProductSelect(interaction);
    if (interaction.customId === 'ticket_type') return handleTicketType(interaction);
  }

  if (interaction.isButton()) {
    if (interaction.customId === 'open_ticket') return handleOpenTicket(interaction);
    if (interaction.customId === 'close_ticket') return handleCloseTicket(interaction);
    if (interaction.customId.startsWith('pay_method_')) return handlePaymentChoice(interaction);
  }
}
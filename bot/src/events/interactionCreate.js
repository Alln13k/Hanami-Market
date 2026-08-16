import {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ChannelType,
  PermissionFlagsBits,
  ButtonStyle,
  ButtonBuilder,
} from 'discord.js';
import { prisma, getSetting } from '../prisma.js';
import { shopEmbed } from '../utils/embeds.js';
import { closeTicket } from '../services/tickets.js';
import { toggleJoin, rerollGiveaway } from '../services/giveaways.js';
import { handleVote } from '../services/polls.js';
import { handleStockNav } from '../services/stock.js';
import { commands } from '../commands/index.js';

// Ouverture d'un ticket depuis le bouton
async function handleOpenTicket(interaction) {
  const guild = interaction.guild;

  if (!guild) {
    return interaction.reply({ content: '❌ Tu dois utiliser ce bouton sur le serveur.', ephemeral: true });
  }

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
    ephemeral: true,
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
        `Bienvenue <@${interaction.user.id}> !\nUn membre du staff va te répondre. Décris ta demande.\n\nID ticket : \`${ticket.id}\``
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
  const result = await closeTicket(interaction.channel.id, 'Ticket fermé par le staff.');
  if (result.ok) {
    await interaction.reply({ content: '🔒 Ticket fermé, il sera supprimé dans quelques secondes.', ephemeral: true });
  }
}

export async function handleInteraction(interaction) {
  // Commandes slash (setup, ticket, addspend, syncboosters...)
  if (interaction.isChatInputCommand()) {
    const command = commands.find((c) => c.data.name === interaction.commandName);
    if (command) {
      try {
        await command.execute(interaction);
      } catch (err) {
        console.error(`Erreur commande /${interaction.commandName}:`, err);
        await interaction
          .reply({ content: '❌ Une erreur est survenue.', ephemeral: true })
          .catch(() => {});
      }
    }
    return;
  }

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'ticket_type') return handleTicketType(interaction);
  }

  if (interaction.isButton()) {
    if (interaction.customId === 'open_ticket') return handleOpenTicket(interaction);
    if (interaction.customId === 'close_ticket') return handleCloseTicket(interaction);
    if (interaction.customId.startsWith('giveaway_join_')) return toggleJoin(interaction);
    if (interaction.customId.startsWith('giveaway_reroll_')) {
      const giveawayId = interaction.customId.replace('giveaway_reroll_', '');
      await rerollGiveaway(giveawayId);
      return interaction.reply({ content: '🔁 Nouveau tirage effectué !', ephemeral: true });
    }
    if (interaction.customId.startsWith('poll_vote_')) return handleVote(interaction);
    if (interaction.customId.startsWith('stock_nav_')) return handleStockNav(interaction);
  }
}
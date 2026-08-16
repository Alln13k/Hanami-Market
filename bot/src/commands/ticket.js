import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { shopEmbed } from '../utils/embeds.js';
import { requireAdmin } from '../utils/perms.js';

export const ticket = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Pose le bouton pour ouvrir un ticket dans ce salon')
    .addStringOption((o) =>
      o.setName('message').setDescription('Texte affiché au-dessus du bouton').setRequired(false)
    ),

  async execute(interaction) {
    if (!requireAdmin(interaction)) return;

    const message = interaction.options.getString('message') || 'Besoin d\'aide ou d\'acheter ? Ouvre un ticket !';

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('🎫 Ouvrir un ticket').setStyle(ButtonStyle.Primary).setCustomId('open_ticket')
    );

    await interaction.reply({
      embeds: [shopEmbed('🎫 Support & Achats', message)],
      components: [row],
    });
  },
};
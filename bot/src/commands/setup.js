import { SlashCommandBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import { prisma, setSetting } from '../prisma.js';
import { shopEmbed } from '../utils/embeds.js';
import { requireAdmin } from '../utils/perms.js';

export const setup = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configure le shop : salon admin, catégorie tickets, rôle admin')
    .addRoleOption((o) => o.setName('role').setDescription('Rôle autorisé à utiliser les commandes admin').setRequired(false)),

  async execute(interaction) {
    if (!requireAdmin(interaction)) return;

    const guild = interaction.guild;

    // Catégorie "Tickets"
    let category = guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildCategory && c.name === 'Tickets'
    );
    if (!category) {
      category = await guild.channels.create({
        name: 'Tickets',
        type: ChannelType.GuildCategory,
      });
    }

    const role = interaction.options.getRole('role') || interaction.member.roles.highest;

    await setSetting('guildId', guild.id);
    await setSetting('ticketCategoryId', category.id);
    await setSetting('adminChannelId', interaction.channel.id);
    await setSetting('adminRoleId', role.id);

    await interaction.reply({
      embeds: [
        shopEmbed(
          '✅ Shop configuré',
          `• **Salon admin** : <#${interaction.channel.id}>\n` +
            `• **Catégorie tickets** : ${category.name}\n` +
            `• **Rôle admin** : <@&${role.id}>`
        ),
      ],
      ephemeral: false,
    });
  },
};
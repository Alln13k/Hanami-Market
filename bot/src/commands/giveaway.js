import { SlashCommandBuilder } from 'discord.js';
import { requireAdmin } from '../utils/perms.js';
import { startGiveaway, finishGiveaway, rerollGiveaway } from '../services/giveaways.js';
import { prisma } from '../prisma.js';

export const giveaway = {
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Lance et gère les giveaways du serveur')
    .addSubcommand((s) =>
      s
        .setName('start')
        .setDescription('Lance un nouveau giveaway')
        .addStringOption((o) => o.setName('title').setDescription('Titre du giveaway').setRequired(true))
        .addStringOption((o) => o.setName('prize').setDescription('Lot à gagner, ex : Nitro 1 mois').setRequired(true))
        .addIntegerOption((o) => o.setName('duration').setDescription('Durée en minutes').setRequired(true).setMinValue(1))
        .addIntegerOption((o) => o.setName('winners').setDescription('Nombre de gagnants').setMinValue(1).setMaxValue(20))
        .addChannelOption((o) => o.setName('channel').setDescription('Salon où afficher le giveaway (défaut : ici)'))
        .addStringOption((o) => o.setName('description').setDescription('Description (optionnelle)'))
    )
    .addSubcommand((s) =>
      s
        .setName('end')
        .setDescription('Termine un giveaway tout de suite')
        .addStringOption((o) => o.setName('id').setDescription('ID du giveaway (défaut : dernier en cours dans ce salon)'))
    )
    .addSubcommand((s) =>
      s
        .setName('reroll')
        .setDescription('Relance le tirage d\'un giveaway terminé')
        .addStringOption((o) => o.setName('id').setDescription('ID du giveaway (défaut : dernier terminé dans ce salon)'))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const id = interaction.options.getString('id');

    if (sub === 'start') {
      if (!requireAdmin(interaction)) return;
      const channel = interaction.options.getChannel('channel') || interaction.channel;
      if (channel.type !== 0) {
        return interaction.reply({ content: '❌ Le salon doit être un salon texte.', ephemeral: true });
      }
      const result = await startGiveaway({
        channel,
        title: interaction.options.getString('title', true),
        prize: interaction.options.getString('prize', true),
        durationMinutes: interaction.options.getInteger('duration', true),
        winners: interaction.options.getInteger('winners') || 1,
        description: interaction.options.getString('description') || '',
      });
      if (!result.ok) return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
      return interaction.reply({ content: `✅ Giveaway lancé dans <#${channel.id}> !`, ephemeral: true });
    }

    if (sub === 'end') {
      if (!requireAdmin(interaction)) return;
      let giveawayId = id;
      if (!giveawayId) {
        const g = await prisma.giveaway.findFirst({
          where: { channelId: interaction.channel.id, status: 'RUNNING' },
          orderBy: { createdAt: 'desc' },
        });
        giveawayId = g?.id;
      }
      if (!giveawayId) return interaction.reply({ content: '❌ Aucun giveaway en cours trouvé.', ephemeral: true });
      const result = await finishGiveaway(giveawayId);
      if (!result.ok) return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
      return interaction.reply({ content: `✅ Giveaway terminé, **${result.winners}** gagnant(s) désigné(s) !`, ephemeral: true });
    }

    if (sub === 'reroll') {
      if (!requireAdmin(interaction)) return;
      let giveawayId = id;
      if (!giveawayId) {
        const g = await prisma.giveaway.findFirst({
          where: { channelId: interaction.channel.id, status: 'FINISHED' },
          orderBy: { endedAt: 'desc' },
        });
        giveawayId = g?.id;
      }
      if (!giveawayId) return interaction.reply({ content: '❌ Aucun giveaway terminé trouvé.', ephemeral: true });
      const result = await rerollGiveaway(giveawayId);
      if (!result.ok) return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
      return interaction.reply({ content: `✅ Nouveau tirage effectué : **${result.winners}** gagnant(s) désigné(s) !`, ephemeral: true });
    }
  },
};
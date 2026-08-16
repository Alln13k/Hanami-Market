import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { requireAdmin } from '../utils/perms.js';
import { addSpend, removeSpend, syncBoosters, updateLeaderboardEmbed } from '../services/leaderboard.js';

export const addspend = {
  data: new SlashCommandBuilder()
    .setName('addspend')
    .setDescription('Ajoute un montant dépensé à un membre (leaderboard + rôle récompense)')
    .addUserOption((o) => o.setName('user').setDescription('Le membre concerné').setRequired(true))
    .addNumberOption((o) => o.setName('amount').setDescription('Montant en euros, ex : 3.57').setRequired(true)),

  async execute(interaction) {
    if (!requireAdmin(interaction)) return;

    const user = interaction.options.getUser('user', true);
    const amount = interaction.options.getNumber('amount', true);
    const member = interaction.guild?.members.cache.get(user.id);
    const username = member?.displayName || user.username;

    const result = await addSpend({ userId: user.id, username, amount });

    if (!result.ok) {
      return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0xf49ecd)
      .setDescription(
        `💸 **${username}** vient de dépenser **${amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}**\n` +
          `Total sur le leaderboard : **${Number(result.totalSpend).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}**`
      )
      .setFooter({ text: 'Leaderboard mis à jour' });

    await interaction.reply({ embeds: [embed] });
    await updateLeaderboardEmbed().catch(() => {});
  },
};

export const removespend = {
  data: new SlashCommandBuilder()
    .setName('removespend')
    .setDescription('Retire des euros à un membre du leaderboard (via son ID Discord)')
    .addStringOption((o) => o.setName('user_id').setDescription('ID Discord du membre, ex : 123456789012345678').setRequired(true))
    .addNumberOption((o) => o.setName('amount').setDescription('Montant à retirer en euros, ex : 5').setRequired(true)),

  async execute(interaction) {
    if (!requireAdmin(interaction)) return;

    const userId = interaction.options.getString('user_id', true).trim();
    const amount = interaction.options.getNumber('amount', true);
    const amountAbs = Math.abs(amount);

    const result = await removeSpend({ userId, amount: amountAbs });

    if (!result.ok) {
      return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0xf49ecd)
      .setDescription(
        `💸 **${result.username || userId}** — **${amountAbs.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}** retiré(e)s du leaderboard\n` +
          `Total : **${Number(result.totalSpend).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}**`
      )
      .setFooter({ text: 'Leaderboard mis à jour' });

    await interaction.reply({ embeds: [embed] });
    await updateLeaderboardEmbed().catch(() => {});
  },
};

export const syncboosters = {
  data: new SlashCommandBuilder()
    .setName('syncboosters')
    .setDescription('Donne le rôle booster à tous les membres qui boostent le serveur'),

  async execute(interaction) {
    if (!requireAdmin(interaction)) return;

    const result = await syncBoosters();
    if (!result.ok) {
      return interaction.reply({ content: '⚠️ Aucun rôle booster défini dans le panel.', ephemeral: true });
    }
    await interaction.reply({
      content: `✅ Rôle booster attribué à **${result.count}** membre(s).`,
      ephemeral: true,
    });
  },
};
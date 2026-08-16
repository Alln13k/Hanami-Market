import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { requireAdmin } from '../utils/perms.js';
import { hexToInt, shopEmbed } from '../utils/embeds.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Supprime des messages : bulkDelete pour les récents (< 14 jours), suppression
// individuelle pour les plus vieux (Discord ne permet pas bulkDelete au-delà).
async function deleteMessages(channel, amount) {
  let total = 0;
  while (true) {
    if (amount > 0 && total >= amount) break;
    const limit = amount > 0 ? Math.min(amount - total, 100) : 100;
    const fetched = await channel.messages.fetch({ limit }).catch(() => null);
    if (!fetched || fetched.size === 0) break;

    const now = Date.now();
    const deletable = fetched.filter((m) => now - m.createdTimestamp < 14 * 86400000);
    const old = fetched.filter((m) => now - m.createdTimestamp >= 14 * 86400000);

    const deleted = await channel.bulkDelete(deletable, true).catch(() => null);
    total += deleted ? deleted.size : 0;

    for (const m of old.values()) {
      if (amount > 0 && total >= amount) break;
      await m.delete().catch(() => {});
      total += 1;
      await sleep(350);
    }

    if (fetched.size < 100) break;
    await sleep(350);
  }
  return total;
}

export const ping = {
  data: new SlashCommandBuilder().setName('ping').setDescription('Latence du bot'),

  async execute(interaction) {
    const sent = await interaction.reply({ content: '🏓 Pong !', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply({
      content: `🏓 Pong ! Latence API : **${latency}ms** · WebSocket : **${interaction.client.ws.ping}ms**`,
    });
  },
};

export const serverinfo = {
  data: new SlashCommandBuilder().setName('serverinfo').setDescription('Informations sur le serveur'),

  async execute(interaction) {
    const guild = interaction.guild;
    if (!guild) return interaction.reply({ content: '❌ Utilisable uniquement sur un serveur.', ephemeral: true });

    const embed = new EmbedBuilder()
      .setColor(hexToInt(undefined))
      .setTitle(`📊 ${guild.name}`)
      .setThumbnail(guild.iconURL())
      .setDescription(
        `👥 **Membres** : ${guild.memberCount}\n` +
          `🎭 **Rôles** : ${guild.roles.cache.size}\n` +
          `💬 **Salons** : ${guild.channels.cache.size} (${guild.channels.cache.filter((c) => c.type === 0).size} texte)\n` +
          `🚀 **Boosts** : ${guild.premiumSubscriptionCount || 0}\n` +
          `📅 **Créé le** : ${guild.createdAt.toLocaleDateString('fr-FR')}\n` +
          `🆔 **ID** : \`${guild.id}\``
      )
      .setFooter({ text: 'Hanami Market' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

export const clear = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Supprime les messages du salon (0 = tout supprimer)')
    .addIntegerOption((o) => o.setName('amount').setDescription('Nombre de messages à supprimer (défaut : tout le salon)').setMinValue(1)),

  async execute(interaction) {
    if (!requireAdmin(interaction)) return;
    const channel = interaction.channel;
    if (!channel || channel.type !== 0) {
      return interaction.reply({ content: '❌ Utilisable uniquement dans un salon texte.', ephemeral: true });
    }

    const amount = interaction.options.getInteger('amount') || 0;
    await interaction.reply({ content: `🧹 Nettoyage du salon en cours...`, ephemeral: true });

    const total = await deleteMessages(channel, amount);

    await interaction.editReply({ content: `✅ **${total}** message(s) supprimé(s) dans <#${channel.id}>.` });
  },
};
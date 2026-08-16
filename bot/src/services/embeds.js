import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { hexToInt } from '../utils/embeds.js';

function buildEmbed(data) {
  const embed = new EmbedBuilder()
    .setColor(hexToInt(data.color || '5865F2'))
    .setTitle(data.title || null)
    .setDescription(data.description || '');

  if (data.imageUrl) embed.setImage(data.imageUrl);
  if (data.footer) embed.setFooter({ text: data.footer });
  if (data.timestamp !== false) embed.setTimestamp();

  for (const f of data.fields || []) {
    if (f?.name && f?.value) {
      embed.addFields({ name: f.name, value: f.value, inline: Boolean(f.inline) });
    }
  }

  return embed;
}

// Envoie un embed custom dans un salon
export async function sendCustomEmbed(channelId, data) {
  const guild = global.client?.guilds?.cache?.first();
  const channel = guild?.channels?.cache?.get(channelId);
  if (!channel) return { ok: false, error: 'Salon introuvable' };

  await channel.send({ embeds: [buildEmbed(data)] });
  return { ok: true };
}

// Envoie un embed avec le bouton "Ouvrir un ticket"
export async function sendTicketButtonEmbed(channelId, data) {
  const guild = global.client?.guilds?.cache?.first();
  const channel = guild?.channels?.cache?.get(channelId);
  if (!channel) return { ok: false, error: 'Salon introuvable' };

  const embed = buildEmbed(data);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel(data.buttonLabel || '🎫 Ouvrir un ticket')
      .setStyle(ButtonStyle.Primary)
      .setCustomId('open_ticket')
  );

  await channel.send({ embeds: [embed], components: [row] });
  return { ok: true };
}
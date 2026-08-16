import { getSetting } from '../prisma.js';
import { shopEmbed } from '../utils/embeds.js';

// Remplace les placeholders {user} {username} {server} par les vraies valeurs
function fill(text, member, guildName) {
  if (!text) return '';
  return text
    .replaceAll('{user}', member ? `<@${member.id}>` : '(@pseudo)')
    .replaceAll('{username}', member?.displayName || 'Pseudo')
    .replaceAll('{server}', guildName || 'le serveur');
}

// Envoie le message de bienvenue quand un membre rejoint
export async function sendWelcome(member) {
  const channelId = await getSetting('welcomeChannelId');
  if (!channelId) return;

  const guild = member.guild || global.client?.guilds?.cache?.first();
  const channel = guild?.channels?.cache?.get(channelId);
  if (!channel) return;

  const title = await getSetting('welcomeTitle', 'Bienvenue ! 🌸');
  const description = await getSetting('welcomeDescription');

  const embed = shopEmbed(fill(title, member, guild?.name), fill(description, member, guild?.name), 'f49ecd')
    .setThumbnail(member.user?.displayAvatarURL() || null);

  await channel.send({ content: `<@${member.id}>`, embeds: [embed] }).catch(() => {});
}

// Envoie un message de test depuis le panel (placeholders remplacés par des exemples)
export async function sendWelcomeTest({ channelId }) {
  const channelIdToUse = channelId || (await getSetting('welcomeChannelId'));
  if (!channelIdToUse) return { ok: false, error: 'Aucun salon de bienvenue configuré' };

  const guild = global.client?.guilds?.cache?.first();
  const channel = guild?.channels?.cache?.get(channelIdToUse);
  if (!channel) return { ok: false, error: 'Salon introuvable' };

  const title = await getSetting('welcomeTitle', 'Bienvenue ! 🌸');
  const description = await getSetting('welcomeDescription');

  const embed = shopEmbed(fill(title, null, guild?.name), fill(description, null, guild?.name), 'f49ecd');

  await channel.send({ embeds: [embed] });
  return { ok: true };
}
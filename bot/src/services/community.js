import { getSetting } from '../prisma.js';
import { shopEmbed } from '../utils/embeds.js';

function fill(text, member, guildName) {
  if (!text) return '';
  return text
    .replaceAll('{user}', member ? `<@${member.id}>` : '(@pseudo)')
    .replaceAll('{username}', member?.displayName || 'Pseudo')
    .replaceAll('{server}', guildName || 'le serveur');
}

// Message d'adieu quand un membre quitte le serveur
export async function sendGoodbye(member) {
  const channelId = await getSetting('goodbyeChannelId');
  if (!channelId) return;

  const guild = member.guild || global.client?.guilds?.cache?.first();
  const channel = guild?.channels?.cache?.get(channelId);
  if (!channel) return;

  const text = await getSetting('goodbyeMessage', '👋 {username} vient de quitter le serveur. À bientôt !');

  await channel
    .send({ embeds: [shopEmbed('👋 Au revoir', fill(text, member, guild?.name), 'f49ecd')] })
    .catch(() => {});
}

// Met à jour le nom d'un salon vocal qui affiche le nombre de membres
export async function updateMemberCounter() {
  const channelId = await getSetting('memberCounterChannelId');
  if (!channelId) return;

  const guild = global.client?.guilds?.cache?.first();
  if (!guild) return;
  const channel = guild.channels.cache.get(channelId);
  if (!channel || !channel.isVoiceBased()) return;

  const name = `👥 Membres : ${guild.memberCount}`;
  if (channel.name !== name) {
    await channel.setName(name).catch(() => {});
  }
}
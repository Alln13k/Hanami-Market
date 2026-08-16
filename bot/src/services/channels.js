import { prisma } from '../prisma.js';

// Synchronise la liste des salons du serveur dans la table GuildChannel
export async function syncChannels() {
  const guild = global.client?.guilds?.cache?.first();
  if (!guild) return;

  await guild.channels.fetch();
  const channels = guild.channels.cache;

  for (const channel of channels.values()) {
    const type =
      channel.type === 4
        ? 'CATEGORY'
        : channel.isVoiceBased && channel.isVoiceBased()
          ? 'VOICE'
          : 'TEXT';

    const isText = type === 'TEXT';

    await prisma.guildChannel.upsert({
      where: { channelId: channel.id },
      update: {
        name: channel.name,
        type,
        position: channel.position ?? 0,
        parentId: channel.parentId ?? null,
        isText,
      },
      create: {
        channelId: channel.id,
        name: channel.name,
        type,
        position: channel.position ?? 0,
        parentId: channel.parentId ?? null,
        isText,
      },
    });
  }
}
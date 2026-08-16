import { prisma } from '../prisma.js';

// Synchronise la liste des salons et rôles du serveur dans la base
export async function syncGuild() {
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

  await guild.roles.fetch();
  for (const role of guild.roles.cache.values()) {
    if (role.tags?.botId) continue; // ignore les rôles de bot
    await prisma.role.upsert({
      where: { roleId: role.id },
      update: {
        name: role.name,
        color: role.hexColor.replace('#', ''),
        position: role.position ?? 0,
      },
      create: {
        roleId: role.id,
        name: role.name,
        color: role.hexColor.replace('#', ''),
        position: role.position ?? 0,
      },
    });
  }
}
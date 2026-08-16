import { prisma } from '../prisma.js';

// Synchronise la liste des salons et rôles du serveur dans la base (temps réel)
export async function syncChannels() {
  const guild = global.client?.guilds?.cache?.first();
  if (!guild) return;

  await guild.channels.fetch();
  const channels = guild.channels.cache;
  const seenChannels = new Set();

  for (const channel of channels.values()) {
    seenChannels.add(channel.id);
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

  // Supprime les salons qui n'existent plus dans le serveur
  await prisma.guildChannel.deleteMany({
    where: { channelId: { notIn: [...seenChannels] } },
  });

  await guild.roles.fetch();
  const seenRoles = new Set();
  for (const role of guild.roles.cache.values()) {
    if (role.tags?.botId) continue; // ignore les rôles de bot
    seenRoles.add(role.id);
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

  await prisma.role.deleteMany({
    where: { roleId: { notIn: [...seenRoles] } },
  });
}

// Synchronise la liste des membres du serveur
export async function syncMembers() {
  const guild = global.client?.guilds?.cache?.first();
  if (!guild) return;

  await guild.members.fetch();
  const seen = new Set();
  for (const member of guild.members.cache.values()) {
    seen.add(member.id);
    await prisma.member.upsert({
      where: { userId: member.id },
      update: {
        name: member.displayName,
        avatarUrl: member.user?.displayAvatarURL() || '',
        isBooster: !!member.premiumSince,
        joinedAt: member.joinedAt,
      },
      create: {
        userId: member.id,
        name: member.displayName,
        avatarUrl: member.user?.displayAvatarURL() || '',
        isBooster: !!member.premiumSince,
        joinedAt: member.joinedAt,
      },
    });
  }

  await prisma.member.deleteMany({
    where: { userId: { notIn: [...seen] } },
  });
}

// Synchronisation complète (salons + rôles + membres)
export async function syncGuild() {
  await syncChannels();
  await syncMembers();
}
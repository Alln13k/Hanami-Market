import { sendWelcome } from '../services/welcome.js';
import { trackJoin } from '../services/invites.js';
import { prisma, getSetting } from '../prisma.js';

// Quand un membre rejoint le serveur : bienvenue + tracking de l'invitation utilisée + ajout en base + auto-rôles
export async function handleGuildMemberAdd(member) {
  await Promise.allSettled([
    sendWelcome(member),
    trackJoin(member),
    prisma.member.upsert({
      where: { userId: member.id },
      update: {
        name: member.displayName,
        avatarUrl: member.user?.displayAvatarURL() || '',
        isBooster: !!member.premiumSince,
        roles: JSON.stringify(member.roles.cache.map((r) => r.id)),
        joinedAt: member.joinedAt,
      },
      create: {
        userId: member.id,
        name: member.displayName,
        avatarUrl: member.user?.displayAvatarURL() || '',
        isBooster: !!member.premiumSince,
        roles: JSON.stringify(member.roles.cache.map((r) => r.id)),
        joinedAt: member.joinedAt,
      },
    }),
    (async () => {
      // Rôles à l'arrivée : liste JSON (autoRoleIds) ou ancien réglage unique (autoRoleId)
      const autoRoleIdsRaw = await getSetting('autoRoleIds');
      let ids = [];
      try {
        ids = autoRoleIdsRaw ? JSON.parse(autoRoleIdsRaw) : [];
      } catch {}
      if (!ids.length) {
        const single = await getSetting('autoRoleId');
        if (single) ids = [single];
      }
      for (const id of ids) {
        await member.roles.add(id).catch(() => {});
      }
    })(),
  ]);
}
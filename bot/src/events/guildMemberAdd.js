import { sendWelcome } from '../services/welcome.js';
import { trackJoin } from '../services/invites.js';
import { prisma } from '../prisma.js';

// Quand un membre rejoint le serveur : bienvenue + tracking de l'invitation utilisée + ajout en base
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
        joinedAt: member.joinedAt,
      },
      create: {
        userId: member.id,
        name: member.displayName,
        avatarUrl: member.user?.displayAvatarURL() || '',
        isBooster: !!member.premiumSince,
        joinedAt: member.joinedAt,
      },
    }),
  ]);
}
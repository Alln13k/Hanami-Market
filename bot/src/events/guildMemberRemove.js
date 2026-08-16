import { trackLeave } from '../services/invites.js';
import { sendGoodbye } from '../services/community.js';
import { prisma } from '../prisma.js';

// Quand un membre quitte le serveur : départ noté, adieu, retrait de la base
export async function handleGuildMemberRemove(member) {
  await Promise.allSettled([
    trackLeave(member),
    sendGoodbye(member),
    prisma.member.deleteMany({ where: { userId: member.id } }),
  ]);
}
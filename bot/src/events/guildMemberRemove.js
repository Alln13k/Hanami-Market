import { trackLeave } from '../services/invites.js';
import { prisma } from '../prisma.js';

// Quand un membre quitte le serveur, on note son départ et on le retire de la base
export async function handleGuildMemberRemove(member) {
  await Promise.allSettled([
    trackLeave(member),
    prisma.member.deleteMany({ where: { userId: member.id } }),
  ]);
}
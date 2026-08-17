import { getSetting } from '../prisma.js';
import { prisma } from '../prisma.js';

// Quand un membre booste / arrête de booster, on attribue / retire le rôle booster
export async function handleGuildMemberUpdate(oldMember, newMember) {
  // Synchronise les rôles du membre en base (changement de rôles / pseudo / boost)
  await prisma.member
    .upsert({
      where: { userId: newMember.id },
      update: {
        name: newMember.displayName,
        avatarUrl: newMember.user?.displayAvatarURL() || '',
        isBooster: !!newMember.premiumSince,
        roles: JSON.stringify(newMember.roles.cache.map((r) => r.id)),
      },
      create: {
        userId: newMember.id,
        name: newMember.displayName,
        avatarUrl: newMember.user?.displayAvatarURL() || '',
        isBooster: !!newMember.premiumSince,
        roles: JSON.stringify(newMember.roles.cache.map((r) => r.id)),
      },
    })
    .catch(() => {});

  if (oldMember.premiumSince === newMember.premiumSince) return;

  const boosterRoleId = await getSetting('boosterRoleId');
  if (!boosterRoleId) return;

  if (newMember.premiumSince && !newMember.roles.cache.has(boosterRoleId)) {
    await newMember.roles.add(boosterRoleId).catch(() => {});
  } else if (!newMember.premiumSince && newMember.roles.cache.has(boosterRoleId)) {
    await newMember.roles.remove(boosterRoleId).catch(() => {});
  }
}
import { getSetting } from '../prisma.js';

// Quand un membre booste / arrête de booster, on attribue / retire le rôle booster
export async function handleGuildMemberUpdate(oldMember, newMember) {
  if (oldMember.premiumSince === newMember.premiumSince) return;

  const boosterRoleId = await getSetting('boosterRoleId');
  if (!boosterRoleId) return;

  if (newMember.premiumSince && !newMember.roles.cache.has(boosterRoleId)) {
    await newMember.roles.add(boosterRoleId).catch(() => {});
  } else if (!newMember.premiumSince && newMember.roles.cache.has(boosterRoleId)) {
    await newMember.roles.remove(boosterRoleId).catch(() => {});
  }
}
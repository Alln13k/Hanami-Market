import { prisma } from '../prisma.js';

function getGuild() {
  return global.client?.guilds?.cache?.first();
}

async function syncMemberRoles(member) {
  await prisma.member
    .update({
      where: { userId: member.id },
      data: { roles: JSON.stringify(member.roles.cache.map((r) => r.id)) },
    })
    .catch(() => {});
}

// Change les permissions d'un rôle (bitfield Discord)
export async function setRolePermissions(payload) {
  const guild = getGuild();
  if (!guild) return { ok: false, error: 'Bot non connecté au serveur' };

  const role = guild.roles.cache.get(payload.roleId);
  if (!role) return { ok: false, error: 'Rôle introuvable' };

  const bits = BigInt(payload.permissions || '0');
  await role.setPermissions(bits);
  await prisma.role.update({
    where: { roleId: role.id },
    data: { permissions: bits.toString() },
  });
  return { ok: true };
}

// Attribue un rôle à un membre
export async function assignRole(payload) {
  const guild = getGuild();
  if (!guild) return { ok: false, error: 'Bot non connecté au serveur' };

  const member = await guild.members.fetch(payload.userId).catch(() => null);
  if (!member) return { ok: false, error: 'Membre introuvable' };

  const role = guild.roles.cache.get(payload.roleId);
  if (!role) return { ok: false, error: 'Rôle introuvable' };
  if (member.roles.cache.has(role.id)) return { ok: true, skipped: true };

  await member.roles.add(role);
  await syncMemberRoles(member);
  return { ok: true };
}

// Retire un rôle à un membre
export async function removeRole(payload) {
  const guild = getGuild();
  if (!guild) return { ok: false, error: 'Bot non connecté au serveur' };

  const member = await guild.members.fetch(payload.userId).catch(() => null);
  if (!member) return { ok: false, error: 'Membre introuvable' };

  const role = guild.roles.cache.get(payload.roleId);
  if (!role) return { ok: false, error: 'Rôle introuvable' };
  if (!member.roles.cache.has(role.id)) return { ok: true, skipped: true };

  await member.roles.remove(role);
  await syncMemberRoles(member);
  return { ok: true };
}
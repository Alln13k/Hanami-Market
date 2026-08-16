import { prisma } from '../prisma.js';

async function logAction(type, targetId, targetName, reason) {
  await prisma.moderationLog.create({
    data: { type, targetId, targetName, reason },
  });
}

// Bannit un membre (par ID) : applique le ban puis journalise
export async function banUser({ targetId, reason }) {
  if (!targetId) return { ok: false, error: 'ID utilisateur requis' };

  const guild = global.client?.guilds?.cache?.first();
  if (!guild) return { ok: false, error: 'Serveur introuvable' };

  let targetName = targetId;
  const member = await guild.members.fetch(targetId).catch(() => null);
  if (member) targetName = member.displayName;

  await guild.bans.create(targetId, { reason: reason || 'Ban via le panel' });

  await logAction('BAN', targetId, targetName, reason || '');
  return { ok: true, targetName };
}

// Exclut (kick) un membre présent sur le serveur
export async function kickUser({ targetId, reason }) {
  if (!targetId) return { ok: false, error: 'ID utilisateur requis' };

  const guild = global.client?.guilds?.cache?.first();
  if (!guild) return { ok: false, error: 'Serveur introuvable' };

  const member = await guild.members.fetch(targetId).catch(() => null);
  if (!member) return { ok: false, error: 'Membre introuvable sur le serveur' };

  await member.kick(reason || 'Kick via le panel');

  await logAction('KICK', targetId, member.displayName, reason || '');
  return { ok: true, targetName: member.displayName };
}

// Retire le ban d'un utilisateur
export async function unbanUser({ targetId, reason }) {
  if (!targetId) return { ok: false, error: 'ID utilisateur requis' };

  const guild = global.client?.guilds?.cache?.first();
  if (!guild) return { ok: false, error: 'Serveur introuvable' };

  await guild.bans.remove(targetId, reason || 'Unban via le panel');

  await logAction('UNBAN', targetId, targetId, reason || '');
  return { ok: true };
}
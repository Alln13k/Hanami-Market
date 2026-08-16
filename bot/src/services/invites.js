import { prisma } from '../prisma.js';

// Enregistre (ou met à jour) toutes les invitations du serveur
export async function syncInvites() {
  const guild = global.client?.guilds?.cache?.first();
  if (!guild) return { ok: true, skipped: true };

  const invites = await guild.invites.fetch().catch(() => new Map());
  for (const [, inv] of invites) {
    await prisma.invite.upsert({
      where: { code: inv.code },
      update: { channelId: inv.channelId, inviterId: inv.inviterId, uses: inv.uses },
      create: {
        code: inv.code,
        channelId: inv.channelId,
        inviterId: inv.inviterId,
        uses: inv.uses,
      },
    });
  }
  return { ok: true, count: invites.size };
}

// Détecte l'invitation utilisée quand un membre rejoint et enregistre l'arrivée
export async function trackJoin(member) {
  const guild = member.guild;
  if (!guild) return;

  const invites = await guild.invites.fetch().catch(() => new Map());

  let matched = null;
  for (const [, inv] of invites) {
    const stored = await prisma.invite.findUnique({ where: { code: inv.code } });
    if (stored && inv.uses > stored.uses) {
      matched = inv;
      break;
    }
  }

  if (matched) {
    await prisma.invite.update({
      where: { code: matched.code },
      data: { uses: matched.uses },
    });
  }

  await prisma.inviteJoin.create({
    data: {
      inviteCode: matched?.code || 'inconnue',
      inviterId: matched?.inviterId || null,
      inviterName: matched?.inviter?.username || '',
      userId: member.id,
      userName: member.displayName,
      avatarUrl: member.user?.displayAvatarURL() || '',
    },
  });
}

// Marque le départ d'un membre arrivé via une invitation
export async function trackLeave(member) {
  const join = await prisma.inviteJoin.findFirst({
    where: { userId: member.id, leftAt: null },
    orderBy: { joinedAt: 'desc' },
  });
  if (join) {
    await prisma.inviteJoin.update({ where: { id: join.id }, data: { leftAt: new Date() } });
  }
}
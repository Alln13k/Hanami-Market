import { prisma } from './prisma';

export type BackupData = {
  version: number;
  exportedAt: string;
  settings: { key: string; value: string }[];
  products: { id: string; name: string; description: string; price: string; stock: number; color: string; isActive: boolean; createdAt: string; updatedAt: string }[];
  leaderboardEntries: { userId: string; username: string; totalSpend: string; roleId: string | null; updatedAt: string }[];
  spendRoles: { id: string; name: string; roleId: string; threshold: string; createdAt: string; updatedAt: string }[];
  proofs: { id: number; number: number; image: string; mimeType: string; createdAt: string }[];
  vouches: { id: string; messageId: string; channelId: string; userId: string; userName: string; targetUserId: string; targetName: string; price: string; product: string; quantity: number; createdAt: string }[];
  customCommands: { id: string; trigger: string; roleId: string | null; responseType: string; text: string; title: string; description: string; color: string; imageUrl: string; footer: string; createdAt: string; updatedAt: string }[];
  members: { userId: string; name: string; avatarUrl: string; isBooster: boolean; joinedAt: string | null; updatedAt: string }[];
  channels: { channelId: string; name: string; type: string; position: number; parentId: string | null; isText: boolean; updatedAt: string }[];
  roles: { roleId: string; name: string; color: string; position: number; updatedAt: string }[];
  moderationLogs: { id: string; type: string; targetId: string; targetName: string; reason: string; createdAt: string }[];
  invites: { code: string; channelId: string | null; inviterId: string | null; uses: number; createdAt: string; updatedAt: string }[];
  inviteJoins: { id: string; inviteCode: string; inviterId: string | null; inviterName: string; userId: string; userName: string; avatarUrl: string; joinedAt: string; leftAt: string | null }[];
  tickets: { id: string; channelId: string; userId: string; userName: string; type: string; status: string; createdAt: string; closedAt: string | null; lastActivityAt: string }[];
  ticketMessages: { id: string; ticketId: string; authorId: string; authorName: string; avatarUrl: string; authorType: string; content: string; createdAt: string }[];
  transcripts: { id: string; channelId: string; userId: string; userName: string; type: string; content: string; openedAt: string; closedAt: string; createdAt: string }[];
};

export async function exportBackup(): Promise<BackupData> {
  const [settings, products, leaderboardEntries, spendRoles, proofs, vouches, customCommands, members, channels, roles, moderationLogs, invites, inviteJoins, tickets, ticketMessages, transcripts] =
    await Promise.all([
      prisma.setting.findMany(),
      prisma.product.findMany(),
      prisma.leaderboardEntry.findMany(),
      prisma.spendRole.findMany(),
      prisma.proof.findMany({ orderBy: { id: 'asc' } }),
      prisma.vouch.findMany(),
      prisma.customCommand.findMany(),
      prisma.member.findMany(),
      prisma.guildChannel.findMany(),
      prisma.role.findMany(),
      prisma.moderationLog.findMany(),
      prisma.invite.findMany(),
      prisma.inviteJoin.findMany(),
      prisma.ticket.findMany(),
      prisma.ticketMessage.findMany(),
      prisma.ticketTranscript.findMany(),
    ]);

  const iso = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString() : null);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    products: products.map((p) => ({ ...p, price: p.price.toString(), createdAt: iso(p.createdAt)!, updatedAt: iso(p.updatedAt)! })),
    leaderboardEntries: leaderboardEntries.map((e) => ({ ...e, totalSpend: e.totalSpend.toString(), updatedAt: iso(e.updatedAt)! })),
    spendRoles: spendRoles.map((r) => ({ ...r, threshold: r.threshold.toString(), createdAt: iso(r.createdAt)!, updatedAt: iso(r.updatedAt)! })),
    proofs: proofs.map((pr) => ({ ...pr, image: pr.image.toString('base64'), createdAt: iso(pr.createdAt)! })),
    vouches: vouches.map((v) => ({ ...v, price: v.price.toString(), createdAt: iso(v.createdAt)! })),
    customCommands: customCommands.map((c) => ({ ...c, createdAt: iso(c.createdAt)!, updatedAt: iso(c.updatedAt)! })),
    members: members.map((m) => ({ ...m, joinedAt: iso(m.joinedAt), updatedAt: iso(m.updatedAt)! })),
    channels: channels.map((c) => ({ ...c, updatedAt: iso(c.updatedAt)! })),
    roles: roles.map((r) => ({ ...r, updatedAt: iso(r.updatedAt)! })),
    moderationLogs: moderationLogs.map((l) => ({ ...l, createdAt: iso(l.createdAt)! })),
    invites: invites.map((i) => ({ ...i, createdAt: iso(i.createdAt)!, updatedAt: iso(i.updatedAt)! })),
    inviteJoins: inviteJoins.map((j) => ({ ...j, joinedAt: iso(j.joinedAt)!, leftAt: iso(j.leftAt) })),
    tickets: tickets.map((t) => ({ ...t, createdAt: iso(t.createdAt)!, closedAt: iso(t.closedAt), lastActivityAt: iso(t.lastActivityAt)! })),
    ticketMessages: ticketMessages.map((m) => ({ ...m, createdAt: iso(m.createdAt)! })),
    transcripts: transcripts.map((t) => ({ ...t, openedAt: iso(t.openedAt)!, closedAt: iso(t.closedAt)!, createdAt: iso(t.createdAt)! })),
  };
}

function num(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function importBackup(data: BackupData) {
  const stats: Record<string, number> = {};

  await prisma.$transaction([
    prisma.setting.createMany({ data: data.settings ?? [], skipDuplicates: true }),
    prisma.product.createMany({ data: (data.products ?? []).map((p) => ({ ...p, price: p.price, createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt) })), skipDuplicates: true }),
    prisma.leaderboardEntry.createMany({ data: (data.leaderboardEntries ?? []).map((e) => ({ ...e, totalSpend: e.totalSpend, updatedAt: new Date(e.updatedAt) })), skipDuplicates: true }),
    prisma.spendRole.createMany({ data: (data.spendRoles ?? []).map((r) => ({ ...r, threshold: r.threshold, createdAt: new Date(r.createdAt), updatedAt: new Date(r.updatedAt) })), skipDuplicates: true }),
    prisma.customCommand.createMany({ data: (data.customCommands ?? []).map((c) => ({ ...c, createdAt: new Date(c.createdAt), updatedAt: new Date(c.updatedAt) })), skipDuplicates: true }),
    prisma.member.createMany({ data: (data.members ?? []).map((m) => ({ ...m, joinedAt: m.joinedAt ? new Date(m.joinedAt) : null, updatedAt: new Date(m.updatedAt) })), skipDuplicates: true }),
    prisma.guildChannel.createMany({ data: (data.channels ?? []).map((c) => ({ ...c, updatedAt: new Date(c.updatedAt) })), skipDuplicates: true }),
    prisma.role.createMany({ data: (data.roles ?? []).map((r) => ({ ...r, updatedAt: new Date(r.updatedAt) })), skipDuplicates: true }),
    prisma.moderationLog.createMany({ data: (data.moderationLogs ?? []).map((l) => ({ ...l, createdAt: new Date(l.createdAt) })), skipDuplicates: true }),
    prisma.invite.createMany({ data: (data.invites ?? []).map((i) => ({ ...i, createdAt: new Date(i.createdAt), updatedAt: new Date(i.updatedAt) })), skipDuplicates: true }),
    prisma.inviteJoin.createMany({ data: (data.inviteJoins ?? []).map((j) => ({ ...j, joinedAt: new Date(j.joinedAt), leftAt: j.leftAt ? new Date(j.leftAt) : null })), skipDuplicates: true }),
    prisma.ticket.createMany({ data: (data.tickets ?? []).map((t) => ({ ...t, createdAt: new Date(t.createdAt), closedAt: t.closedAt ? new Date(t.closedAt) : null, lastActivityAt: new Date(t.lastActivityAt) })), skipDuplicates: true }),
  ]);

  // Fichiers (proofs) : importer les images encodées en base64
  for (const proof of data.proofs ?? []) {
    await prisma.proof.upsert({
      where: { id: proof.id },
      update: {},
      create: { id: proof.id, number: proof.number, image: Buffer.from(proof.image, 'base64'), mimeType: proof.mimeType, createdAt: new Date(proof.createdAt) },
    });
  }

  // Les messages doivent être créés après les tickets (clé étrangère)
  await prisma.ticketMessage.createMany({ data: (data.ticketMessages ?? []).map((m) => ({ ...m, createdAt: new Date(m.createdAt) })), skipDuplicates: true });
  await prisma.ticketTranscript.createMany({ data: (data.transcripts ?? []).map((t) => ({ ...t, openedAt: new Date(t.openedAt), closedAt: new Date(t.closedAt), createdAt: new Date(t.createdAt) })), skipDuplicates: true });

  stats.settings = data.settings?.length ?? 0;
  stats.products = data.products?.length ?? 0;
  stats.leaderboardEntries = data.leaderboardEntries?.length ?? 0;
  stats.spendRoles = data.spendRoles?.length ?? 0;
  stats.proofs = data.proofs?.length ?? 0;
  stats.vouches = data.vouches?.length ?? 0;
  stats.customCommands = data.customCommands?.length ?? 0;
  stats.members = data.members?.length ?? 0;
  stats.channels = data.channels?.length ?? 0;
  stats.roles = data.roles?.length ?? 0;
  stats.moderationLogs = data.moderationLogs?.length ?? 0;
  stats.invites = data.invites?.length ?? 0;
  stats.inviteJoins = data.inviteJoins?.length ?? 0;
  stats.tickets = data.tickets?.length ?? 0;
  stats.ticketMessages = data.ticketMessages?.length ?? 0;
  stats.transcripts = data.transcripts?.length ?? 0;
  stats.vouches = data.vouches?.length ?? 0;

  return stats;
}
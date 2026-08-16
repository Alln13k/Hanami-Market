import { mkdir, writeFile, readdir, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { prisma, getSetting, setSetting } from '../prisma.js';

const BACKUP_DIR = resolve(process.cwd(), 'backups');

function clean(value) {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value)) return value.toString('base64');
  if (typeof value === 'object' && typeof value.toNumber === 'function') return value.toString(); // Prisma Decimal
  if (Array.isArray(value)) return value.map(clean);
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = clean(v);
    return out;
  }
  return value;
}

// Prend un instantané complet de toutes les données et l'écrit dans backups/backup-<date>.json
export async function dumpBackup({ keep } = {}) {
  const [
    settings,
    products,
    leaderboardEntries,
    spendRoles,
    proofs,
    vouches,
    customCommands,
    members,
    channels,
    roles,
    moderationLogs,
    invites,
    inviteJoins,
    tickets,
    ticketMessages,
    transcripts,
  ] = await Promise.all([
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

  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: clean(settings),
    products: clean(products),
    leaderboardEntries: clean(leaderboardEntries),
    spendRoles: clean(spendRoles),
    proofs: clean(proofs),
    vouches: clean(vouches),
    customCommands: clean(customCommands),
    members: clean(members),
    channels: clean(channels),
    roles: clean(roles),
    moderationLogs: clean(moderationLogs),
    invites: clean(invites),
    inviteJoins: clean(inviteJoins),
    tickets: clean(tickets),
    ticketMessages: clean(ticketMessages),
    transcripts: clean(transcripts),
  };

  await mkdir(BACKUP_DIR, { recursive: true });
  const filename = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  await writeFile(join(BACKUP_DIR, filename), JSON.stringify(data, null, 2), 'utf-8');

  // Ne garde que les N derniers fichiers (défaut : 20) pour ne pas saturer le disque
  const files = (await readdir(BACKUP_DIR)).filter((f) => f.startsWith('backup-') && f.endsWith('.json')).sort();
  const max = typeof keep === 'number' ? keep : 20;
  if (files.length > max) {
    for (const old of files.slice(0, files.length - max)) {
      await unlink(join(BACKUP_DIR, old)).catch(() => {});
    }
  }

  await setSetting('lastBackupAt', data.exportedAt).catch(() => {});
  return {
    ok: true,
    filename,
    path: join(BACKUP_DIR, filename),
    counts: {
      settings: data.settings.length,
      products: data.products.length,
      leaderboardEntries: data.leaderboardEntries.length,
      spendRoles: data.spendRoles.length,
      proofs: data.proofs.length,
      vouches: data.vouches.length,
      customCommands: data.customCommands.length,
      members: data.members.length,
      channels: data.channels.length,
      roles: data.roles.length,
      moderationLogs: data.moderationLogs.length,
      invites: data.invites.length,
      inviteJoins: data.inviteJoins.length,
      tickets: data.tickets.length,
      ticketMessages: data.ticketMessages.length,
      transcripts: data.transcripts.length,
    },
  };
}

// Redémarre le bot (utilisé par la sauvegarde si besoin d'un filtre global)
export { BACKUP_DIR };
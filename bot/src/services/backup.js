import { mkdir, writeFile, readFile, readdir, unlink, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { prisma, getSetting, setSetting } from '../prisma.js';
import { syncGuild } from './channels.js';

// Dossier BACKUP à la racine du projet (sur l'hébergeur du bot)
const BACKUP_DIR = resolve(process.cwd(), 'BACKUP');
const MAX_BACKUPS = 50;

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

function isIso(s) {
  return typeof s === 'string' && !Number.isNaN(Date.parse(s));
}
function toDate(v) {
  return isIso(v) ? new Date(v) : new Date();
}

// --- Liste des serveurs du bot (pour choisir la source / la cible d'une restauration) ---

export function getBotGuilds() {
  const guilds = global.client?.guilds?.cache?.map((g) => ({
    id: g.id,
    name: g.name,
    memberCount: g.memberCount || 0,
  }));
  return guilds || [];
}

export async function syncBotGuilds() {
  await setSetting('botGuilds', JSON.stringify(getBotGuilds())).catch(() => {});
}

// --- Lecture du dossier BACKUP et synchronisation de l'historique en base ---

export async function syncBackupsTable() {
  try {
    await mkdir(BACKUP_DIR, { recursive: true });
    const files = await readdir(BACKUP_DIR);
    const backups = files.filter((f) => f.endsWith('.json'));
    const seen = [];
    for (const filename of backups) {
      const path = join(BACKUP_DIR, filename);
      const info = await stat(path).catch(() => null);
      if (!info) continue;
      let guildId = null;
      let guildName = '';
      try {
        const raw = await readFile(path, 'utf-8');
        const head = raw.slice(0, 4096);
        const match = head.match(/"sourceGuild"\s*:\s*\{[^}]*"id"\s*:\s*"([^"]+)"[^}]*"name"\s*:\s*"([^"]+)"/);
        if (match) {
          guildId = match[1];
          guildName = match[2];
        }
      } catch {
        /* lecture partielle impossible */
      }
      seen.push(filename);
      await prisma.backup.upsert({
        where: { filename },
        update: { size: info.size, guildId, guildName },
        create: { filename, size: info.size, guildId, guildName, createdAt: info.mtime },
      }).catch(() => {});
    }
    // Supprime les lignes dont le fichier n'existe plus
    const rows = await prisma.backup.findMany();
    for (const row of rows) {
      if (!seen.includes(row.filename)) {
        await prisma.backup.delete({ where: { id: row.id } }).catch(() => {});
      }
    }
  } catch {
    /* ignore */
  }
}

// --- Créer une sauvegarde ---

export async function dumpBackup({ note } = {}) {
  const source = global.client?.guilds?.cache?.first();
  const sourceGuild = source
    ? { id: source.id, name: source.name }
    : { id: '', name: '' };

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
    version: 2,
    exportedAt: new Date().toISOString(),
    sourceGuild,
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
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${sourceGuild.name || 'server'}-${stamp}.json`;
  const filePath = join(BACKUP_DIR, filename);
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

  const info = await stat(filePath);
  await prisma.backup.upsert({
    where: { filename },
    update: { size: info.size, guildId: sourceGuild.id || null, guildName: sourceGuild.name, note: note || '' },
    create: { filename, size: info.size, guildId: sourceGuild.id || null, guildName: sourceGuild.name, note: note || '' },
  });

  // Rotation : ne garde que les MAX_BACKUPS plus récents
  const files = (await readdir(BACKUP_DIR)).filter((f) => f.endsWith('.json')).sort();
  if (files.length > MAX_BACKUPS) {
    for (const old of files.slice(0, files.length - MAX_BACKUPS)) {
      await unlink(join(BACKUP_DIR, old)).catch(() => {});
    }
  }
  await syncBackupsTable().catch(() => {});

  await setSetting('lastBackupAt', data.exportedAt).catch(() => {});
  return {
    ok: true,
    filename,
    size: info.size,
    counts: {
      channels: data.channels.length,
      roles: data.roles.length,
      members: data.members.length,
      leaderboardEntries: data.leaderboardEntries.length,
      products: data.products.length,
      vouches: data.vouches.length,
      proofs: data.proofs.length,
      tickets: data.tickets.length,
    },
  };
}

// --- Supprimer une sauvegarde (fichier + historique) ---

export async function deleteBackup({ filename }) {
  if (!filename || !filename.endsWith('.json') || filename.includes('/') || filename.includes('\\')) {
    return { ok: false, error: 'Nom de fichier invalide' };
  }
  await unlink(join(BACKUP_DIR, filename)).catch(() => {});
  await prisma.backup.deleteMany({ where: { filename } }).catch(() => {});
  return { ok: true };
}

// --- Importer les données d'une sauvegarde dans la base (upsert, fusion) ---

export async function importBackupData(data) {
  // Réglages : appliqués (upsert) pour que la restauration reproduise la configuration d'origine
  for (const s of data.settings ?? []) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: String(s.value) },
      create: { key: s.key, value: String(s.value) },
    }).catch(() => {});
  }

  await prisma.$transaction([
    prisma.product.createMany({
      data: (data.products ?? []).map((p) => ({
        id: p.id, name: p.name, description: p.description ?? '', price: p.price, stock: p.stock ?? 0,
        color: p.color ?? 'f49ecd', isActive: p.isActive ?? true, createdAt: toDate(p.createdAt), updatedAt: toDate(p.updatedAt),
      })),
      skipDuplicates: true,
    }),
    prisma.leaderboardEntry.createMany({
      data: (data.leaderboardEntries ?? []).map((e) => ({
        userId: e.userId, username: e.username ?? '', totalSpend: e.totalSpend, roleId: e.roleId ?? null, updatedAt: toDate(e.updatedAt),
      })),
      skipDuplicates: true,
    }),
    prisma.spendRole.createMany({
      data: (data.spendRoles ?? []).map((r) => ({
        id: r.id, name: r.name, roleId: r.roleId, threshold: r.threshold, createdAt: toDate(r.createdAt), updatedAt: toDate(r.updatedAt),
      })),
      skipDuplicates: true,
    }),
    prisma.customCommand.createMany({
      data: (data.customCommands ?? []).map((c) => ({
        id: c.id, trigger: c.trigger, roleId: c.roleId ?? null, responseType: c.responseType ?? 'TEXT',
        text: c.text ?? '', title: c.title ?? '', description: c.description ?? '', color: c.color ?? 'f49ecd',
        imageUrl: c.imageUrl ?? '', footer: c.footer ?? '', reactions: c.reactions ?? '', cooldown: c.cooldown ?? 0,
        deleteTrigger: c.deleteTrigger ?? false, channelId: c.channelId ?? null, usageCount: c.usageCount ?? 0,
        createdAt: toDate(c.createdAt), updatedAt: toDate(c.updatedAt),
      })),
      skipDuplicates: true,
    }),
    prisma.member.createMany({
      data: (data.members ?? []).map((m) => ({
        userId: m.userId, name: m.name ?? '', avatarUrl: m.avatarUrl ?? '', isBooster: m.isBooster ?? false,
        joinedAt: m.joinedAt ? toDate(m.joinedAt) : null, updatedAt: toDate(m.updatedAt),
      })),
      skipDuplicates: true,
    }),
    prisma.guildChannel.createMany({
      data: (data.channels ?? []).map((c) => ({
        channelId: c.channelId, name: c.name, type: c.type ?? 'TEXT', position: c.position ?? 0,
        parentId: c.parentId ?? null, isText: c.isText ?? true, updatedAt: toDate(c.updatedAt),
      })),
      skipDuplicates: true,
    }),
    prisma.role.createMany({
      data: (data.roles ?? []).map((r) => ({
        roleId: r.roleId, name: r.name, color: r.color ?? '', position: r.position ?? 0, updatedAt: toDate(r.updatedAt),
      })),
      skipDuplicates: true,
    }),
    prisma.moderationLog.createMany({
      data: (data.moderationLogs ?? []).map((l) => ({
        id: l.id, type: l.type, targetId: l.targetId, targetName: l.targetName ?? '', reason: l.reason ?? '', createdAt: toDate(l.createdAt),
      })),
      skipDuplicates: true,
    }),
    prisma.invite.createMany({
      data: (data.invites ?? []).map((i) => ({
        code: i.code, channelId: i.channelId ?? null, inviterId: i.inviterId ?? null, uses: i.uses ?? 0,
        createdAt: toDate(i.createdAt), updatedAt: toDate(i.updatedAt),
      })),
      skipDuplicates: true,
    }),
    prisma.inviteJoin.createMany({
      data: (data.inviteJoins ?? []).map((j) => ({
        id: j.id, inviteCode: j.inviteCode ?? '', inviterId: j.inviterId ?? null, inviterName: j.inviterName ?? '',
        userId: j.userId, userName: j.userName ?? '', avatarUrl: j.avatarUrl ?? '',
        joinedAt: toDate(j.joinedAt), leftAt: j.leftAt ? toDate(j.leftAt) : null,
      })),
      skipDuplicates: true,
    }),
    prisma.ticket.createMany({
      data: (data.tickets ?? []).map((t) => ({
        id: t.id, channelId: t.channelId, userId: t.userId, userName: t.userName ?? '', type: t.type ?? 'SUPPORT',
        status: t.status ?? 'OPEN', createdAt: toDate(t.createdAt), closedAt: t.closedAt ? toDate(t.closedAt) : null,
        lastActivityAt: t.lastActivityAt ? toDate(t.lastActivityAt) : toDate(t.createdAt),
      })),
      skipDuplicates: true,
    }),
  ]);

  for (const proof of data.proofs ?? []) {
    await prisma.proof.upsert({
      where: { id: proof.id },
      update: { number: proof.number, mimeType: proof.mimeType ?? 'image/png' },
      create: {
        id: proof.id, number: proof.number, image: Buffer.from(proof.image, 'base64'),
        mimeType: proof.mimeType ?? 'image/png', createdAt: toDate(proof.createdAt),
      },
    }).catch(() => {});
  }

  await prisma.ticketMessage.createMany({
    data: (data.ticketMessages ?? []).map((m) => ({
      id: m.id, ticketId: m.ticketId, authorId: m.authorId, authorName: m.authorName ?? '',
      avatarUrl: m.avatarUrl ?? '', authorType: m.authorType ?? 'USER', content: m.content, createdAt: toDate(m.createdAt),
    })),
    skipDuplicates: true,
  });
  await prisma.ticketTranscript.createMany({
    data: (data.transcripts ?? []).map((t) => ({
      id: t.id, channelId: t.channelId, userId: t.userId, userName: t.userName ?? '', type: t.type ?? 'SUPPORT',
      content: t.content, openedAt: toDate(t.openedAt), closedAt: toDate(t.closedAt), createdAt: toDate(t.createdAt),
    })),
    skipDuplicates: true,
  });
}

function sanitizeChannelName(name) {
  const clean = name
    .toLowerCase()
    .replace(/[^a-z0-9\u00e0-\u00ff\-_ ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100);
  return clean || 'channel';
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CHANNEL_TYPES = { TEXT: 0, VOICE: 2, CATEGORY: 4 };

// --- Restaurer une sauvegarde : importe les données puis recrée le serveur sur la guilde cible ---

export async function restoreBackup({ filename, guildId }) {
  if (!filename || !filename.endsWith('.json') || filename.includes('/') || filename.includes('\\')) {
    return { ok: false, error: 'Nom de fichier invalide' };
  }

  const guild = global.client?.guilds?.cache?.get(guildId);
  if (!guild) return { ok: false, error: `Le bot n'est pas sur le serveur ${guildId}` };

  const filePath = join(BACKUP_DIR, filename);
  let data;
  try {
    data = JSON.parse(await readFile(filePath, 'utf-8'));
  } catch {
    return { ok: false, error: 'Fichier de sauvegarde introuvable ou illisible' };
  }

  // 1) Importe toutes les données dans la base (fusion)
  try {
    await importBackupData(data);
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }

  // 2) Recrée les rôles sur le serveur cible
  const roleMap = new Map();
  const roles = (data.roles ?? []).slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  let rolesCreated = 0;
  for (const role of roles) {
    if (!role.roleId || role.roleId === guild.id) continue; // @everyone
    try {
      const created = await guild.roles.create({
        name: String(role.name || 'role').slice(0, 100),
        color: parseInt(String(role.color || 'f49ecd'), 16) || 0,
        hoist: false,
        mentionable: false,
        position: Math.min(role.position ?? 0, 50),
      });
      roleMap.set(role.roleId, created.id);
      rolesCreated++;
      await sleep(400);
    } catch {
      /* rôle en collision ou permissions : on continue */
    }
  }

  // Met à jour les rôles en base avec les nouveaux IDs
  for (const [oldId, newId] of roleMap) {
    const row = (data.roles ?? []).find((r) => r.roleId === oldId);
    if (row) {
      await prisma.role.upsert({
        where: { roleId: newId },
        update: {},
        create: { roleId: newId, name: row.name, color: row.color ?? '', position: row.position ?? 0 },
      }).catch(() => {});
      await prisma.role.deleteMany({ where: { roleId: oldId } }).catch(() => {});
    }
  }

  // 3) Recrée les catégories puis les salons sur le serveur cible
  const channelMap = new Map();
  const channels = (data.channels ?? []).slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const categories = channels.filter((c) => (c.type || 'TEXT') === 'CATEGORY');
  const nonCategories = channels.filter((c) => (c.type || 'TEXT') !== 'CATEGORY');
  let channelsCreated = 0;

  for (const cat of categories) {
    try {
      const created = await guild.channels.create({
        name: sanitizeChannelName(cat.name),
        type: CHANNEL_TYPES.CATEGORY,
        position: Math.min(cat.position ?? 0, 50),
      });
      channelMap.set(cat.channelId, created.id);
      channelsCreated++;
      await sleep(400);
    } catch {
      /* ignore */
    }
  }

  for (const ch of channels) {
    if ((ch.type || 'TEXT') === 'CATEGORY') continue;
    const parentId = ch.parentId ? channelMap.get(ch.parentId) : undefined;
    try {
      const created = await guild.channels.create({
        name: sanitizeChannelName(ch.name),
        type: CHANNEL_TYPES[ch.type || 'TEXT'] ?? 0,
        position: Math.min(ch.position ?? 0, 50),
        parent: parentId,
      });
      channelMap.set(ch.channelId, created.id);
      channelsCreated++;
      await sleep(400);
    } catch {
      /* ignore */
    }
  }

  // Met à jour les salons en base avec les nouveaux IDs
  for (const [oldId, newId] of channelMap) {
    const row = (data.channels ?? []).find((c) => c.channelId === oldId);
    if (row) {
      await prisma.guildChannel.upsert({
        where: { channelId: newId },
        update: {},
        create: {
          channelId: newId, name: row.name, type: row.type ?? 'TEXT', position: row.position ?? 0,
          parentId: row.parentId ? channelMap.get(row.parentId) : null, isText: row.isText ?? true,
        },
      }).catch(() => {});
      await prisma.guildChannel.deleteMany({ where: { channelId: oldId } }).catch(() => {});
    }
  }

  // 4) Remappe les réglages : salon admin, catégorie tickets, salons d'embeds, rôles...
  const mapChannelId = (id) => (id && channelMap.get(id)) || '';
  const mapRoleId = (id) => (id && roleMap.get(id)) || '';

  const settings = await prisma.setting.findMany();
  const updates = {
    guildId: guild.id,
    adminChannelId: mapChannelId(settings.find((s) => s.key === 'adminChannelId')?.value),
    ticketCategoryId: mapChannelId(settings.find((s) => s.key === 'ticketCategoryId')?.value),
    vouchChannelId: mapChannelId(settings.find((s) => s.key === 'vouchChannelId')?.value),
    productsEmbedChannelId: mapChannelId(settings.find((s) => s.key === 'productsEmbedChannelId')?.value),
    leaderboardChannelId: mapChannelId(settings.find((s) => s.key === 'leaderboardChannelId')?.value),
    proofChannelId: mapChannelId(settings.find((s) => s.key === 'proofChannelId')?.value),
    welcomeChannelId: mapChannelId(settings.find((s) => s.key === 'welcomeChannelId')?.value),
    ticketLogsChannelId: mapChannelId(settings.find((s) => s.key === 'ticketLogsChannelId')?.value),
    adminRoleId: mapRoleId(settings.find((s) => s.key === 'adminRoleId')?.value),
    boosterRoleId: mapRoleId(settings.find((s) => s.key === 'boosterRoleId')?.value),
    vouchAllowedRoleId: mapRoleId(settings.find((s) => s.key === 'vouchAllowedRoleId')?.value),
  };

  for (const [key, value] of Object.entries(updates)) {
    if (key === 'guildId') {
      await setSetting('guildId', guild.id);
    } else {
      const trimmed = String(value || '').trim();
      const old = settings.find((s) => s.key === key)?.value;
      if (old && trimmed !== old) {
        await prisma.setting.upsert({
          where: { key },
          update: { value: trimmed },
          create: { key, value: trimmed },
        });
      }
    }
  }

  await syncGuild().catch(() => {});
  await syncBotGuilds().catch(() => {});

  return {
    ok: true,
    guild: guild.name,
    channelsCreated,
    rolesCreated,
  };
}

export { BACKUP_DIR };
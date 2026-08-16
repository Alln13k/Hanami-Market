import { prisma, getSetting, setSetting } from '../prisma.js';
import { shopEmbed } from '../utils/embeds.js';

const MEDALS = ['🥇', '🥈', '🥉'];
const SERVER_IMAGE = 'https://i.imgur.com/s2BQbyJ.jpeg';

function formatEuro(value) {
  return Number(value).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

// Met à jour (ou crée) l'embed public du leaderboard
export async function updateLeaderboardEmbed(channelIdOverride) {
  const channelId = channelIdOverride || (await getSetting('leaderboardChannelId'));
  if (!channelId) return { ok: true, skipped: true };

  const guild = global.client?.guilds?.cache?.first();
  const channel = guild?.channels?.cache?.get(channelId);
  if (!channel) return { ok: false, error: 'Salon introuvable' };

  const entries = await prisma.leaderboardEntry.findMany({
    orderBy: [{ totalSpend: 'desc' }, { updatedAt: 'asc' }],
    take: 10,
  });

  // Statistiques des ventes du serveur (nombre de ventes, articles vendus, chiffre d'affaires)
  const vouches = await prisma.vouch.findMany({ select: { price: true, quantity: true } }).catch(() => []);
  const sales = vouches.length;
  const items = vouches.reduce((a, v) => a + (v.quantity || 0), 0);
  const revenue = vouches.reduce((a, v) => a + Number(v.price) * (v.quantity || 0), 0);

  const lines = entries.map((e, i) => {
    const rank = MEDALS[i] || `${i + 1}.`;
    const role = e.roleId ? ` <@&${e.roleId}>` : '';
    return `${rank} **${e.username || e.userId}** — ${formatEuro(e.totalSpend)}${role}`;
  });

  const stats = `🛒 **Ventes du serveur** : ${sales} vente${sales > 1 ? 's' : ''} · ${items} article${items > 1 ? 's' : ''} vendu${items > 1 ? 's' : ''} · ${formatEuro(revenue)} de chiffre d'affaires`;

  const embed = shopEmbed(
    '🏆 Leaderboard des dépenses',
    lines.length ? `${stats}\n━━━━━━━━━━━━━━━━\n${lines.join('\n')}` : `${stats}\nAucune dépense enregistrée pour le moment.`,
    'f49ecd'
  )
    .setThumbnail(SERVER_IMAGE)
    .setFooter({ text: `Mis à jour le ${new Date().toLocaleString('fr-FR')}` });

  const messageId = await getSetting('leaderboardMessageId');

  if (messageId) {
    const existing = await channel.messages.fetch(messageId).catch(() => null);
    if (existing) {
      await existing.edit({ embeds: [embed] });
      return { ok: true };
    }
  }

  const sent = await channel.send({ embeds: [embed] });
  await setSetting('leaderboardMessageId', sent.id);
  await setSetting('leaderboardChannelId', channelId);
  return { ok: true };
}

// Ajoute un montant dépensé : met à jour le total, vérifie les rôles récompense, rafraîchit l'embed
export async function addSpend({ userId, username, amount }) {
  const value = Math.max(0, Number(amount) || 0);
  if (!userId || value <= 0) return { ok: false, error: 'Montant invalide' };

  const entry = await prisma.leaderboardEntry.upsert({
    where: { userId },
    update: { username: username || undefined, totalSpend: { increment: value } },
    create: { userId, username: username || 'Utilisateur inconnu', totalSpend: value },
  });

  const roleId = await checkAndApplyRoles(userId, entry.totalSpend);

  await prisma.leaderboardEntry.update({
    where: { userId },
    data: { roleId: roleId || null },
  });

  await updateLeaderboardEmbed().catch(() => {});
  return { ok: true, totalSpend: entry.totalSpend };
}

// Retire un montant dépensé : baisse le total (min 0), rétrograde le rôle récompense si besoin, rafraîchit l'embed
export async function removeSpend({ userId, amount }) {
  if (!userId) return { ok: false, error: 'ID utilisateur requis' };
  const value = Math.max(0, Number(amount) || 0);
  if (value <= 0) return { ok: false, error: 'Montant invalide' };

  const entry = await prisma.leaderboardEntry.findUnique({ where: { userId } });
  if (!entry) return { ok: false, error: 'Ce membre n\'est pas sur le leaderboard.' };

  const newTotal = Math.max(0, Number(entry.totalSpend) - value);

  // Rétrograde : retire le rôle du palier actuel si le nouveau total ne le justifie plus
  const tierRoleId = await getTierRoleId(newTotal);
  const oldRoleId = entry.roleId;

  if (oldRoleId && tierRoleId !== oldRoleId) {
    const guild = global.client?.guilds?.cache?.first();
    const member = guild ? await guild.members.fetch(userId).catch(() => null) : null;
    if (member) {
      if (member.roles.cache.has(oldRoleId)) {
        await member.roles.remove(oldRoleId).catch(() => {});
      }
      if (tierRoleId && !member.roles.cache.has(tierRoleId)) {
        await member.roles.add(tierRoleId).catch(() => {});
      }
    }
  }

  await prisma.leaderboardEntry.update({
    where: { userId },
    data: { totalSpend: newTotal, roleId: tierRoleId || null },
  });

  await updateLeaderboardEmbed().catch(() => {});
  return { ok: true, totalSpend: newTotal, username: entry.username };
}

// Retourne l'ID du rôle correspondant au palier le plus haut atteint (seuil <= total)
async function getTierRoleId(total) {
  const tiers = await prisma.spendRole.findMany({ orderBy: { threshold: 'desc' } });
  if (tiers.length === 0) return null;
  const reached = tiers.find((t) => Number(total) >= Number(t.threshold));
  return reached ? reached.roleId : null;
}

// Donne au membre le plus haut palier atteint (seuil <= total)
export async function checkAndApplyRoles(userId, total) {
  const guild = global.client?.guilds?.cache?.first();
  if (!guild) return null;

  const tiers = await prisma.spendRole.findMany({ orderBy: { threshold: 'desc' } });
  if (tiers.length === 0) return null;

  const reached = tiers.find((t) => Number(total) >= Number(t.threshold));
  if (!reached) return null;

  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) return reached.roleId;

  if (!member.roles.cache.has(reached.roleId)) {
    await member.roles.add(reached.roleId).catch(() => {});
  }
  return reached.roleId;
}

// Donne le rôle booster à tous les membres qui boostent le serveur
export async function syncBoosters() {
  const guild = global.client?.guilds?.cache?.first();
  const boosterRoleId = await getSetting('boosterRoleId');
  if (!guild || !boosterRoleId) return { ok: false, skipped: true };

  await guild.members.fetch();
  let count = 0;
  for (const member of guild.members.cache.values()) {
    if (member.premiumSince && !member.roles.cache.has(boosterRoleId)) {
      await member.roles.add(boosterRoleId).catch(() => {});
      count += 1;
    }
  }
  return { ok: true, count };
}

// Ré-applique les rôles récompense à tous les membres du leaderboard
export async function syncAllRoles() {
  const entries = await prisma.leaderboardEntry.findMany();
  for (const e of entries) {
    const roleId = await checkAndApplyRoles(e.userId, e.totalSpend);
    if (roleId !== e.roleId) {
      await prisma.leaderboardEntry.update({ where: { userId: e.userId }, data: { roleId: roleId || null } });
    }
  }
  await updateLeaderboardEmbed().catch(() => {});
  return { ok: true };
}
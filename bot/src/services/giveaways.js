import { prisma } from '../prisma.js';
import { shopEmbed } from '../utils/embeds.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

const timers = new Map(); // giveawayId -> setTimeout

function formatDuration(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}j ${h}h ${m}min`;
  if (h > 0) return `${h}h ${m}min ${sec}s`;
  if (m > 0) return `${m}min ${sec}s`;
  return `${sec}s`;
}

function progressBar(g) {
  const total = g.endsAt.getTime() - g.createdAt.getTime();
  if (total <= 0) return '▓▓▓▓▓▓▓▓▓▓';
  const elapsed = Math.max(0, Math.min(1, (Date.now() - g.createdAt.getTime()) / total));
  const filled = Math.round(elapsed * 10);
  return '▓'.repeat(filled) + '░'.repeat(10 - filled);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Tirage pondéré (poids = participations) avec des gagnants tous différents
function pickWinners(entries, count) {
  const pool = [];
  for (const e of entries) {
    for (let i = 0; i < (e.weight || 1); i++) pool.push(e);
  }
  const chosen = [];
  const seen = new Set();
  for (const e of shuffle(pool)) {
    if (seen.has(e.userId)) continue;
    seen.add(e.userId);
    chosen.push(e);
    if (chosen.length >= count) break;
  }
  return chosen;
}

function restrictionsText(g) {
  const parts = [];
  if (g.requiredRoleId) parts.push(`Rôle requis : <@&${g.requiredRoleId}>`);
  try {
    const banned = JSON.parse(g.bannedRoleIds || '[]');
    if (Array.isArray(banned) && banned.length) parts.push(`Exclus : ${banned.map((id) => `<@&${id}>`).join(' ')}`);
  } catch {}
  if (g.minSpend && Number(g.minSpend) > 0) {
    parts.push(`Minimum dépensé : **${Number(g.minSpend).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}**`);
  }
  if (g.maxParticipants > 0) parts.push(`Max participants : ${g.maxParticipants}`);
  if (g.boostersBonus > 0) parts.push(`Boosts : +${g.boostersBonus} participation(s)`);
  return parts.length ? `\n\u26A0\uFE0F ${parts.join(' · ')}` : '';
}

function buildGiveawayEmbed(g, entries) {
  const embed = shopEmbed(
    '🎉 GIVEAWAY',
    `**${g.title}**\n${g.description ? `${g.description}\n` : ''}` +
      `🎁 **Prix** : ${g.prize}\n` +
      `👥 **Participants** : ${entries.length}\n` +
      `🏆 **Gagnants** : ${g.winners}\n` +
      `\`${progressBar(g)}\`\n` +
      `⏰ ${g.status === 'RUNNING' ? `Se termine dans **${formatDuration(g.endsAt.getTime() - Date.now())}**` : `Terminé le ${g.endedAt?.toLocaleString('fr-FR')}`}` +
      restrictionsText(g)
  );
  return embed;
}

// Lance un giveaway et programme sa fin
export async function startGiveaway({
  channel,
  title,
  prize,
  description,
  winners,
  durationMinutes,
  requiredRoleId,
  bannedRoleIds,
  minSpend,
  boostersBonus,
  maxParticipants,
  announceChannelId,
  pingRoleId,
  dmMessage,
  deleteOnEnd,
}) {
  const endsAt = new Date(Date.now() + durationMinutes * 60 * 1000);

  const giveaway = await prisma.giveaway.create({
    data: {
      channelId: channel.id,
      title,
      prize,
      description: description || '',
      winners: Math.max(1, winners || 1),
      endsAt,
      status: 'RUNNING',
      requiredRoleId: requiredRoleId || null,
      bannedRoleIds: Array.isArray(bannedRoleIds) ? JSON.stringify(bannedRoleIds) : (bannedRoleIds || '[]'),
      minSpend: minSpend && Number(minSpend) > 0 ? Number(minSpend) : null,
      boostersBonus: Math.max(0, boostersBonus || 0),
      maxParticipants: Math.max(0, maxParticipants || 0),
      announceChannelId: announceChannelId || null,
      pingRoleId: pingRoleId || null,
      dmMessage: dmMessage || '',
      deleteOnEnd: !!deleteOnEnd,
    },
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel('🎉 Participer').setStyle(ButtonStyle.Success).setCustomId(`giveaway_join_${giveaway.id}`)
  );

  const sent = await channel.send({
    content: pingRoleId ? `<@&${pingRoleId}>` : '',
    embeds: [buildGiveawayEmbed(giveaway, 0)],
    components: [row],
  }).catch(async () => {
    // Si le ping d'un rôle échoue (permissions), on renvoie sans ping
    return channel.send({ embeds: [buildGiveawayEmbed(giveaway, 0)], components: [row] });
  });

  await prisma.giveaway.update({ where: { id: giveaway.id }, data: { messageId: sent.id } });

  scheduleTimer(giveaway.id, endsAt);
  return { ok: true, giveaway };
}

// Vérifie les restrictions avant de laisser un membre participer
async function canJoin(giveaway, interaction) {
  const member = interaction.member;
  const userId = interaction.user.id;

  if (giveaway.requiredRoleId && member && !member.roles.cache.has(giveaway.requiredRoleId)) {
    return { ok: false, reason: `Il faut le rôle <@&${giveaway.requiredRoleId}> pour participer.` };
  }
  try {
    const banned = JSON.parse(giveaway.bannedRoleIds || '[]');
    if (Array.isArray(banned) && banned.some((id) => member?.roles?.cache?.has(id))) {
      return { ok: false, reason: 'Ton rôle ne permet pas de participer à ce giveaway.' };
    }
  } catch {}
  if (giveaway.minSpend && Number(giveaway.minSpend) > 0) {
    const entry = await prisma.leaderboardEntry.findUnique({ where: { userId } });
    if (!entry || Number(entry.totalSpend) < Number(giveaway.minSpend)) {
      return {
        ok: false,
        reason: `Il faut avoir dépensé au moins **${Number(giveaway.minSpend).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}** sur le serveur pour participer.`,
      };
    }
  }
  if (giveaway.maxParticipants > 0) {
    const count = await prisma.giveawayEntry.count({ where: { giveawayId: giveaway.id } });
    if (count >= giveaway.maxParticipants) {
      return { ok: false, reason: 'Ce giveaway est complet (participants maximum atteint).' };
    }
  }
  return { ok: true };
}

// Bascule la participation d'un membre (bouton)
export async function toggleJoin(interaction) {
  const giveawayId = interaction.customId.replace('giveaway_join_', '');
  const giveaway = await prisma.giveaway.findUnique({ where: { id: giveawayId } });
  if (!giveaway || giveaway.status !== 'RUNNING') {
    return interaction.reply({ content: '❌ Ce giveaway est terminé.', ephemeral: true });
  }

  const existing = await prisma.giveawayEntry.findUnique({
    where: { giveawayId_userId: { giveawayId, userId: interaction.user.id } },
  });

  if (existing) {
    await prisma.giveawayEntry.delete({ where: { id: existing.id } });
    const count = await prisma.giveawayEntry.count({ where: { giveawayId } });
    const message = await interaction.channel?.messages.fetch(giveaway.messageId).catch(() => null);
    if (message) {
      await message
        .edit({
          embeds: [buildGiveawayEmbed(giveaway, count)],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder().setLabel('🎉 Participer').setStyle(ButtonStyle.Success).setCustomId(`giveaway_join_${giveaway.id}`)
            ),
          ],
        })
        .catch(() => {});
    }
    return interaction.reply({ content: '❌ Tu ne participes plus.', ephemeral: true });
  }

  const check = await canJoin(giveaway, interaction);
  if (!check.ok) {
    return interaction.reply({ content: `❌ ${check.reason}`, ephemeral: true });
  }

  const weight = 1 + (interaction.member?.premiumSince && giveaway.boostersBonus > 0 ? giveaway.boostersBonus : 0);

  await prisma.giveawayEntry.create({
    data: {
      giveawayId,
      userId: interaction.user.id,
      userName: interaction.member?.displayName || interaction.user.username,
      avatarUrl: interaction.user.displayAvatarURL(),
      weight,
    },
  });
  const count = await prisma.giveawayEntry.count({ where: { giveawayId } });
  const message = await interaction.channel?.messages.fetch(giveaway.messageId).catch(() => null);
  if (message) {
    await message
      .edit({
        embeds: [buildGiveawayEmbed(giveaway, count)],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel('🎉 Participer').setStyle(ButtonStyle.Success).setCustomId(`giveaway_join_${giveaway.id}`)
          ),
        ],
      })
      .catch(() => {});
  }
  return interaction.reply({ content: '✅ Tu participes ! Bonne chance 🍀', ephemeral: true });
}

async function recordWinners(giveawayId, picked) {
  if (!picked.length) return;
  await prisma.giveawayWinner.createMany({
    data: picked.map((e) => ({
      giveawayId,
      userId: e.userId,
      userName: e.userName,
      avatarUrl: e.avatarUrl,
    })),
    skipDuplicates: true,
  }).catch(() => {});
}

async function dmWinners(giveaway, picked) {
  for (const e of picked) {
    const user = await global.client?.users?.fetch(e.userId).catch(() => null);
    if (!user) continue;
    const text = giveaway.dmMessage || `Tu remportes **${giveaway.prize}** (${giveaway.title}). Contacte le staff pour récupérer ton lot !`;
    await user
      .send({ embeds: [shopEmbed('🎉 Tu as gagné !', text)] })
      .catch(() => {});
  }
}

// Termine un giveaway : tirage des gagnants + message annonce + DM aux gagnants
export async function finishGiveaway(giveawayId) {
  const giveaway = await prisma.giveaway.findUnique({
    where: { id: giveawayId },
    include: { entries: true },
  });
  if (!giveaway || giveaway.status !== 'RUNNING') return { ok: false, error: 'Giveaway introuvable ou déjà terminé' };

  clearTimer(giveaway.id);

  const picked = pickWinners(giveaway.entries, Math.max(1, giveaway.winners));
  const winnersText = picked.length ? picked.map((e) => `<@${e.userId}>`).join(', ') : 'Personne';

  await recordWinners(giveaway.id, picked);
  await dmWinners(giveaway, picked);

  await prisma.giveaway.update({
    where: { id: giveaway.id },
    data: { status: 'FINISHED', endedAt: new Date() },
  });

  const guild = global.client?.guilds?.cache?.first();
  const channel = guild?.channels?.cache?.get(giveaway.channelId);
  if (channel) {
    // Supprime le message du giveaway si demandé
    if (giveaway.deleteOnEnd) {
      await channel.messages.delete(giveaway.messageId).catch(() => {});
    } else {
      const embed = buildGiveawayEmbed(giveaway, giveaway.entries.length).setDescription(
        `**${giveaway.title}**\n${giveaway.description ? `${giveaway.description}\n` : ''}\n` +
          `🎁 **Prix** : ${giveaway.prize}\n` +
          `🏆 **Gagnants** : ${winnersText}\n` +
          `⏰ Terminé !`
      );
      const row = picked.length
        ? new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel('🔁 Relancer le tirage').setStyle(ButtonStyle.Secondary).setCustomId(`giveaway_reroll_${giveaway.id}`)
          )
        : null;
      const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
      if (message) {
        await message.edit({ embeds: [embed], components: row ? [row] : [] }).catch(() => {});
      }
    }

    const announceChannel = giveaway.announceChannelId
      ? guild?.channels?.cache?.get(giveaway.announceChannelId)
      : channel;
    const where = announceChannel || channel;
    await where
      .send({
        embeds: [
          shopEmbed(
            '🎉 Gagnants du giveaway',
            `${winnersText} remporte${picked.length > 1 ? 'nt' : ''} **${giveaway.prize}** ! Félicitations 🎊`
          ),
        ],
      })
      .catch(() => {});
  }

  return { ok: true, winners: picked.length };
}

// Relance le tirage d'un giveaway terminé
export async function rerollGiveaway(giveawayId) {
  const giveaway = await prisma.giveaway.findUnique({
    where: { id: giveawayId },
    include: { entries: true },
  });
  if (!giveaway || giveaway.status !== 'FINISHED') return { ok: false, error: 'Giveaway introuvable ou pas encore terminé' };

  const picked = pickWinners(giveaway.entries, Math.max(1, giveaway.winners));
  const winnersText = picked.length ? picked.map((e) => `<@${e.userId}>`).join(', ') : 'Personne';

  await recordWinners(giveaway.id, picked);
  await dmWinners(giveaway, picked);

  const guild = global.client?.guilds?.cache?.first();
  const channel = guild?.channels?.cache?.get(giveaway.channelId);
  if (channel) {
    const announceChannel = giveaway.announceChannelId
      ? guild?.channels?.cache?.get(giveaway.announceChannelId)
      : channel;
    const where = announceChannel || channel;
    await where
      .send({
        embeds: [
          shopEmbed('🔁 Nouveau tirage', `${winnersText} remporte${picked.length > 1 ? 'nt' : ''} **${giveaway.prize}** ! Félicitations 🎊`),
        ],
      })
      .catch(() => {});
  }

  return { ok: true, winners: picked.length };
}

function scheduleTimer(giveawayId, endsAt) {
  clearTimer(giveawayId);
  const delay = endsAt.getTime() - Date.now();
  if (delay <= 0) {
    finishGiveaway(giveawayId).catch(() => {});
    return;
  }
  timers.set(
    giveawayId,
    setTimeout(() => finishGiveaway(giveawayId).catch(() => {}), delay)
  );
}

function clearTimer(giveawayId) {
  const t = timers.get(giveawayId);
  if (t) clearTimeout(t);
  timers.delete(giveawayId);
}

// Reprend les giveaways en cours après un redémarrage (timers + ceux déjà dépassés)
export async function resumeGiveaways() {
  const running = await prisma.giveaway.findMany({ where: { status: 'RUNNING' } }).catch(() => []);
  for (const g of running) {
    scheduleTimer(g.id, g.endsAt);
  }
}

// Vérifie périodiquement les giveaways expirés (filet de sécurité si le timer a sauté)
export async function checkExpiredGiveaways() {
  const expired = await prisma.giveaway
    .findMany({ where: { status: 'RUNNING', endsAt: { lt: new Date() } } })
    .catch(() => []);
  for (const g of expired) {
    await finishGiveaway(g.id).catch(() => {});
  }
}
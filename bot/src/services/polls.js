import { prisma } from '../prisma.js';
import { shopEmbed } from '../utils/embeds.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const timers = new Map(); // pollId -> setTimeout

const EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];

function parseOptions(poll) {
  try {
    const opts = JSON.parse(poll.options || '[]');
    return Array.isArray(opts) ? opts.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function formatDuration(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min ${sec}s`;
  return `${sec}s`;
}

function buildPollEmbed(poll, options, counts) {
  const total = counts.reduce((a, b) => a + b, 0);
  const lines = options.map((opt, i) => {
    const count = counts[i] || 0;
    const pct = total ? Math.round((count / total) * 100) : 0;
    const bar = '▓'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10));
    return `${EMOJIS[i] || `${i + 1}.`} **${opt}**\n\`${bar}\` ${count} vote${count > 1 ? 's' : ''} (${pct}%)`;
  });

  const time =
    poll.status === 'OPEN'
      ? poll.endAt
        ? `Se termine dans **${formatDuration(new Date(poll.endAt).getTime() - Date.now())}**`
        : 'Sondage permanent'
      : 'Terminé';

  return shopEmbed(
    '📊 Sondage',
    `**${poll.question}**\n\n${lines.join('\n\n')}\n\n⏰ ${time} — ${total} vote${total > 1 ? 's' : ''} au total`,
    'f49ecd'
  );
}

function buildRows(pollId, options, open) {
  const rows = [];
  const rowSize = 5;
  for (let r = 0; r < Math.ceil(options.length / rowSize); r++) {
    const row = new ActionRowBuilder();
    for (let i = r * rowSize; i < Math.min((r + 1) * rowSize, options.length); i++) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`poll_vote_${pollId}_${i}`)
          .setLabel(`${EMOJIS[i] || i + 1}`)
          .setStyle(ButtonStyle.Primary)
          .setDisabled(!open)
      );
    }
    rows.push(row);
  }
  return rows;
}

// Crée un sondage interactif
export async function createPoll({ channel, question, options, durationMinutes }) {
  const cleanOptions = options.slice(0, 9);
  const endAt = durationMinutes && durationMinutes > 0 ? new Date(Date.now() + durationMinutes * 60000) : null;

  const poll = await prisma.poll.create({
    data: {
      channelId: channel.id,
      messageId: '', // rempli après l'envoi du message
      question,
      options: JSON.stringify(cleanOptions),
      endAt,
      status: 'OPEN',
    },
  });

  const sent = await channel.send({
    embeds: [buildPollEmbed(poll, cleanOptions, cleanOptions.map(() => 0))],
    components: buildRows(poll.id, cleanOptions, true),
  });

  await prisma.poll.update({ where: { id: poll.id }, data: { messageId: sent.id } });

  if (endAt) scheduleTimer(poll.id, endAt);
  return { ok: true, poll };
}

// Vote (ou changement de vote / annulation) depuis un bouton
export async function handleVote(interaction) {
  const match = interaction.customId.match(/^poll_vote_(.+)_(\d+)$/);
  if (!match) return;
  const [, pollId, indexStr] = match;
  const index = parseInt(indexStr, 10);

  const poll = await prisma.poll.findUnique({ where: { id: pollId } });
  if (!poll || poll.status !== 'OPEN') {
    return interaction.reply({ content: '❌ Ce sondage est terminé.', ephemeral: true });
  }

  const existing = await prisma.pollVote.findUnique({
    where: { pollId_userId: { pollId, userId: interaction.user.id } },
  });

  if (existing && existing.index === index) {
    // Cliquer sur son propre choix annule le vote
    await prisma.pollVote.delete({ where: { id: existing.id } });
  } else if (existing) {
    await prisma.pollVote.update({ where: { id: existing.id }, data: { index } });
  } else {
    await prisma.pollVote.create({
      data: { pollId, userId: interaction.user.id, index },
    });
  }

  await refreshPollMessage(poll.id);
  const options = parseOptions(poll);
  return interaction.reply({
    content: existing && existing.index === index
      ? `❌ Vote retiré pour « ${options[index]} ».`
      : `✅ Vote enregistré pour « ${options[index]} ».`,
    ephemeral: true,
  });
}

async function refreshPollMessage(pollId) {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: { votes: true },
  });
  if (!poll) return;
  const options = parseOptions(poll);
  const counts = options.map((_, i) => poll.votes.filter((v) => v.index === i).length);

  const guild = global.client?.guilds?.cache?.first();
  const channel = guild?.channels?.cache?.get(poll.channelId);
  if (!channel) return;
  const message = await channel.messages.fetch(poll.messageId).catch(() => null);
  if (message) {
    await message
      .edit({
        embeds: [buildPollEmbed(poll, options, counts)],
        components: buildRows(poll.id, options, poll.status === 'OPEN'),
      })
      .catch(() => {});
  }
}

// Termine un sondage (boutons désactivés)
export async function endPoll(pollId) {
  const poll = await prisma.poll.findUnique({ where: { id: pollId } });
  if (!poll || poll.status !== 'OPEN') return { ok: false, error: 'Sondage introuvable ou déjà terminé' };

  clearTimer(pollId);
  await prisma.poll.update({ where: { id: pollId }, data: { status: 'CLOSED' } });
  await refreshPollMessage(pollId);
  return { ok: true };
}

function scheduleTimer(pollId, endAt) {
  clearTimer(pollId);
  const delay = endAt.getTime() - Date.now();
  if (delay <= 0) {
    endPoll(pollId).catch(() => {});
    return;
  }
  timers.set(
    pollId,
    setTimeout(() => endPoll(pollId).catch(() => {}), delay)
  );
}

function clearTimer(pollId) {
  const t = timers.get(pollId);
  if (t) clearTimeout(t);
  timers.delete(pollId);
}

// Reprend les sondages en cours après redémarrage
export async function resumePolls() {
  const open = await prisma.poll.findMany({ where: { status: 'OPEN', endAt: { not: null } } }).catch(() => []);
  for (const p of open) {
    if (p.endAt && p.endAt > new Date()) scheduleTimer(p.id, p.endAt);
  }
  const expired = await prisma.poll
    .findMany({ where: { status: 'OPEN', endAt: { lt: new Date() } } })
    .catch(() => []);
  for (const p of expired) {
    await endPoll(p.id).catch(() => {});
  }
}
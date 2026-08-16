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

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildGiveawayEmbed(g, entries) {
  const embed = shopEmbed(
    '🎉 GIVEAWAY',
    `**${g.title}**\n${g.description ? `${g.description}\n` : ''}\n` +
      `🎁 **Prix** : ${g.prize}\n` +
      `👥 **Participants** : ${entries.length}\n` +
      `🏆 **Gagnants** : ${g.winners}\n` +
      `⏰ ${g.status === 'RUNNING' ? `Se termine dans **${formatDuration(g.endsAt.getTime() - Date.now())}**` : `Terminé le ${g.endedAt?.toLocaleString('fr-FR')}`}`
  );
  return embed;
}

// Lance un giveaway et programme sa fin
export async function startGiveaway({ channel, title, prize, description, winners, durationMinutes }) {
  const endsAt = new Date(Date.now() + durationMinutes * 60 * 1000);

  const giveaway = await prisma.giveaway.create({
    data: { channelId: channel.id, title, prize, description, winners, endsAt, status: 'RUNNING' },
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel('🎉 Participer').setStyle(ButtonStyle.Success).setCustomId(`giveaway_join_${giveaway.id}`)
  );

  const sent = await channel.send({ embeds: [buildGiveawayEmbed(giveaway, 0)], components: [row] });
  await prisma.giveaway.update({ where: { id: giveaway.id }, data: { messageId: sent.id } });

  scheduleTimer(giveaway.id, endsAt);
  return { ok: true, giveaway };
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
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('🎉 Participer').setStyle(ButtonStyle.Success).setCustomId(`giveaway_join_${giveaway.id}`)
      );
      await message.edit({ embeds: [buildGiveawayEmbed(giveaway, count)], components: [row] }).catch(() => {});
    }
    return interaction.reply({ content: '❌ Tu ne participes plus.', ephemeral: true });
  }

  await prisma.giveawayEntry.create({
    data: {
      giveawayId,
      userId: interaction.user.id,
      userName: interaction.member?.displayName || interaction.user.username,
      avatarUrl: interaction.user.displayAvatarURL(),
    },
  });
  const count = await prisma.giveawayEntry.count({ where: { giveawayId } });
  const message = await interaction.channel?.messages.fetch(giveaway.messageId).catch(() => null);
  if (message) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('🎉 Participer').setStyle(ButtonStyle.Success).setCustomId(`giveaway_join_${giveaway.id}`)
    );
    await message.edit({ embeds: [buildGiveawayEmbed(giveaway, count)], components: [row] }).catch(() => {});
  }
  return interaction.reply({ content: '✅ Tu participes ! Bonne chance 🍀', ephemeral: true });
}

// Termine un giveaway : tirage des gagnants + message annonce + DM aux gagnants
export async function finishGiveaway(giveawayId) {
  const giveaway = await prisma.giveaway.findUnique({
    where: { id: giveawayId },
    include: { entries: true },
  });
  if (!giveaway || giveaway.status !== 'RUNNING') return { ok: false, error: 'Giveaway introuvable ou déjà terminé' };

  clearTimer(giveaway.id);

  const entries = giveaway.entries;
  const picked = shuffle(entries).slice(0, Math.max(1, Math.min(giveaway.winners, entries.length)));
  const winnersText = picked.length ? picked.map((e) => `<@${e.userId}>`).join(', ') : 'Personne';

  const embed = buildGiveawayEmbed(giveaway, entries.length).setDescription(
    `**${giveaway.title}**\n${giveaway.description ? `${giveaway.description}\n` : ''}\n` +
      `🎁 **Prix** : ${giveaway.prize}\n` +
      `🏆 **Gagnants** : ${winnersText}\n` +
      `⏰ Terminé !`
  );

  await prisma.giveaway.update({
    where: { id: giveaway.id },
    data: { status: 'FINISHED', endedAt: new Date() },
  });

  const channel = global.client?.channels?.cache?.get(giveaway.channelId);
  if (channel) {
    const row = picked.length
      ? new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel('🔁 Relancer le tirage').setStyle(ButtonStyle.Secondary).setCustomId(`giveaway_reroll_${giveaway.id}`)
        )
      : null;
    const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);
    if (message) {
      await message.edit({ embeds: [embed], components: row ? [row] : [] }).catch(() => {});
    }
    await channel.send({
      embeds: [shopEmbed('🎉 Gagnants du giveaway', `${winnersText} remporte${picked.length > 1 ? 'nt' : ''} **${giveaway.prize}** ! Félicitations 🎊`)],
    }).catch(() => {});
  }

  // DM les gagnants
  for (const e of picked) {
    const user = await global.client?.users?.fetch(e.userId).catch(() => null);
    if (user) {
      await user.send({ embeds: [shopEmbed('🎉 Tu as gagné !', `Tu remportes **${giveaway.prize}** (${giveaway.title}). Contacte le staff pour récupérer ton lot !`)] }).catch(() => {});
    }
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

  const entries = giveaway.entries;
  const picked = shuffle(entries).slice(0, Math.max(1, Math.min(giveaway.winners, entries.length)));
  const winnersText = picked.length ? picked.map((e) => `<@${e.userId}>`).join(', ') : 'Personne';

  const channel = global.client?.channels?.cache?.get(giveaway.channelId);
  if (channel) {
    await channel.send({
      embeds: [shopEmbed('🔁 Nouveau tirage', `${winnersText} remporte${picked.length > 1 ? 'nt' : ''} **${giveaway.prize}** ! Félicitations 🎊`)],
    }).catch(() => {});
  }

  for (const e of picked) {
    const user = await global.client?.users?.fetch(e.userId).catch(() => null);
    if (user) {
      await user.send({ embeds: [shopEmbed('🎉 Tu as gagné !', `Tu remportes **${giveaway.prize}** (${giveaway.title}). Contacte le staff pour récupérer ton lot !`)] }).catch(() => {});
    }
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
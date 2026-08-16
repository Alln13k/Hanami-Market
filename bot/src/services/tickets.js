import { prisma, getSetting } from '../prisma.js';
import { shopEmbed } from '../utils/embeds.js';

// Envoie un message dans le salon admin (logs)
export async function notifyAdmin(message) {
  const guild = global.client?.guilds?.cache?.first();
  const adminChannelId = await getSetting('adminChannelId');
  if (!guild || !adminChannelId) return;
  const channel = guild.channels.cache.get(adminChannelId);
  if (channel) channel.send(message).catch(() => {});
}

// Stocke un message de ticket (utilisé par l'événement messageCreate)
export async function storeTicketMessage(ticketId, { authorId, authorName, avatarUrl, authorType, content }) {
  await prisma.ticketMessage.create({
    data: { ticketId, authorId, authorName, avatarUrl, authorType, content },
  });
}

// Ferme, archive la transcription puis supprime proprement un ticket
export async function closeTicket(channelId, reason = 'Ticket fermé') {
  const ticket = await prisma.ticket.findUnique({
    where: { channelId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!ticket) return { ok: false, error: 'Ticket introuvable' };
  if (ticket.status === 'CLOSED') return { ok: true };

  const guild = global.client?.guilds?.cache?.first();
  const channel = guild?.channels?.cache?.get(channelId);

  if (channel) {
    const embed = shopEmbed('🔒 Ticket fermé', reason);
    await channel.send({ embeds: [embed] }).catch(() => {});
  }

  // Construit la transcription
  const lines = [
    `🎫 Ticket ${ticket.type} — ${ticket.userName} (${ticket.userId})`,
    `🕐 Ouvert : ${ticket.createdAt.toISOString()}`,
    `🔒 Fermé : ${new Date().toISOString()}`,
    `📝 Raison : ${reason}`,
    '----------------------------------------',
    ...ticket.messages.map(
      (m) => `[${m.createdAt.toISOString()}] (${m.authorType}) ${m.authorName} :\n${m.content}`
    ),
  ];

  // Archive la transcription puis supprime le ticket et ses messages
  try {
    await prisma.ticketTranscript.create({
      data: {
        channelId: ticket.channelId,
        userId: ticket.userId,
        userName: ticket.userName,
        type: ticket.type,
        content: lines.join('\n\n'),
        openedAt: ticket.createdAt,
        closedAt: new Date(),
      },
    });
    await prisma.ticket.delete({ where: { id: ticket.id } });
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }

  // Suppression différée du salon
  setTimeout(async () => {
    try {
      await channel?.delete();
    } catch {
      /* déjà supprimé */
    }
  }, 5000);

  return { ok: true };
}

// Répond à un ticket depuis le panel : envoie le message en tant que le bot puis le stocke
export async function replyToTicket(ticketId, content, staffName = 'Staff') {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return { ok: false, error: 'Ticket introuvable' };

  const guild = global.client?.guilds?.cache?.first();
  const channel = guild?.channels?.cache?.get(ticket.channelId);
  if (!channel) return { ok: false, error: 'Salon du ticket introuvable' };

  const bot = global.client?.user;
  await channel.send({ content }).catch(() => {});

  await storeTicketMessage(ticket.id, {
    authorId: bot?.id || 'panel',
    authorName: bot?.displayName || staffName,
    avatarUrl: bot?.displayAvatarURL() || '',
    authorType: 'BOT',
    content,
  });

  return { ok: true };
}
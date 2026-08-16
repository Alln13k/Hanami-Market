import { prisma } from '../prisma.js';
import { closeTicket, replyToTicket } from './tickets.js';
import { sendCustomEmbed, sendTicketButtonEmbed } from './embeds.js';
import { syncChannels } from './channels.js';

const POLL_INTERVAL = 5000; // 5 secondes

async function processAction(action) {
  try {
    const payload = JSON.parse(action.payload || '{}');
    let result;

    switch (action.type) {
      case 'CLOSE_TICKET':
        result = await closeTicket(payload.channelId, payload.reason || 'Ticket fermé depuis le panel');
        break;
      case 'REPLY_TICKET':
        result = await replyToTicket(payload.ticketId, payload.content || '', payload.staffName || 'Staff');
        break;
      case 'SEND_EMBED':
        result = await sendCustomEmbed(payload.channelId, payload);
        break;
      case 'CREATE_TICKET_BUTTON':
        result = await sendTicketButtonEmbed(payload.channelId, payload);
        break;
      default:
        result = { ok: true, skipped: true };
    }

    await prisma.botAction.update({
      where: { id: action.id },
      data: {
        status: result?.ok === false ? 'FAILED' : 'DONE',
        error: result?.ok === false ? result.error : null,
        executedAt: new Date(),
      },
    });
  } catch (err) {
    await prisma.botAction.update({
      where: { id: action.id },
      data: { status: 'FAILED', error: String(err?.message || err), executedAt: new Date() },
    });
  }
}

export function startWorker() {
  setInterval(async () => {
    try {
      const actions = await prisma.botAction.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        take: 20,
      });
      for (const action of actions) {
        await processAction(action);
      }
    } catch {
      /* erreur DB temporaire : on retente au prochain tick */
    }
  }, POLL_INTERVAL);

  // Synchronisation des salons toutes les 5 minutes
  setInterval(async () => {
    try {
      await syncChannels();
    } catch {
      /* ignore */
    }
  }, 5 * 60 * 1000);
}
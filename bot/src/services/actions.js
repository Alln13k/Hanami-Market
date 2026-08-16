import { prisma } from '../prisma.js';
import { closeTicket, replyToTicket } from './tickets.js';
import { sendCustomEmbed, sendTicketButtonEmbed } from './embeds.js';
import { updateProductsEmbed } from './products.js';
import { updateLeaderboardEmbed, addSpend, syncBoosters, syncAllRoles } from './leaderboard.js';
import { sendProof } from './proofs.js';
import { sendVouchTutorial, deleteVouch } from './vouch.js';
import { sendWelcomeTest } from './welcome.js';
import { banUser, kickUser, unbanUser } from './moderation.js';
import { syncInvites } from './invites.js';
import { syncGuild } from './channels.js';

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
      case 'UPDATE_PRODUCTS_EMBED':
        result = await updateProductsEmbed(payload.channelId || null);
        break;
      case 'UPDATE_LEADERBOARD_EMBED':
        result = await updateLeaderboardEmbed(payload.channelId || null);
        break;
      case 'ADD_SPEND':
        result = await addSpend(payload);
        break;
      case 'SYNC_BOOSTERS':
        result = await syncBoosters();
        break;
      case 'SYNC_ROLES':
        result = await syncAllRoles();
        break;
      case 'SEND_PROOF':
        result = await sendProof(payload);
        break;
      case 'SEND_VOUCH_TUTORIAL':
        result = await sendVouchTutorial(payload);
        break;
      case 'DELETE_VOUCH':
        result = await deleteVouch(payload);
        break;
      case 'SEND_WELCOME_TEST':
        result = await sendWelcomeTest(payload);
        break;
      case 'BAN_USER':
        result = await banUser(payload);
        break;
      case 'KICK_USER':
        result = await kickUser(payload);
        break;
      case 'UNBAN_USER':
        result = await unbanUser(payload);
        break;
      case 'SYNC_INVITES':
        result = await syncInvites();
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

  // Synchronisation des salons, rôles, membres et invitations toutes les 5 minutes
  setInterval(async () => {
    try {
      await syncGuild();
      await syncInvites();
    } catch {
      /* ignore */
    }
  }, 5 * 60 * 1000);
}
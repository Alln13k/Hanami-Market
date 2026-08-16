import { prisma } from '../prisma.js';
import { deliverOrder, closeTicket } from './delivery.js';
import { getPaymentStatus, PAID_STATUSES } from './payments.js';

const POLL_INTERVAL = 5000; // 5 secondes

async function processAction(action) {
  try {
    const payload = JSON.parse(action.payload || '{}');
    let result;

    switch (action.type) {
      case 'DELIVER_ORDER':
        result = await deliverOrder(payload.orderId);
        break;
      case 'CLOSE_TICKET':
        result = await closeTicket(payload.channelId, payload.reason || 'Ticket fermé depuis le panel');
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

// Vérifie les paiements Litecoin en attente (secours si le webhook Vercel n'a pas reçu l'IPN)
async function pollLtcPayments() {
  const pending = await prisma.order.findMany({
    where: { status: 'PENDING', paymentMethod: 'LITECOIN', paymentId: { not: null } },
    select: { id: true, paymentId: true },
  });

  for (const order of pending) {
    const status = await getPaymentStatus(order.paymentId);
    if (status && PAID_STATUSES.includes(status)) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'PAID', paidAt: new Date() },
      });
      await deliverOrder(order.id);
    }
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

  // Vérification des paiements LTC toutes les 45s
  setInterval(async () => {
    try {
      await pollLtcPayments();
    } catch {
      /* ignore */
    }
  }, 45000);
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createHmac } from 'crypto';

// Reçu depuis NowPayments quand un paiement LTC change de statut.
export async function POST(req: NextRequest) {
  const raw = await req.text();

  // Vérification de la signature IPN (optionnelle mais recommandée)
  const signature = req.headers.get('x-nowpayments-sig');
  if (signature && process.env.NOWPAYMENTS_API_KEY) {
    const expected = createHmac('sha512', process.env.NOWPAYMENTS_API_KEY)
      .update(raw)
      .digest('hex');
    if (signature !== expected) {
      return NextResponse.json({ error: 'Signature invalide' }, { status: 401 });
    }
  }

  const data = JSON.parse(raw);

  // NowPayments envoie payment_id + payment_status
  const paymentId = String(data.payment_id || data.paymentId || '');
  const status = String(data.payment_status || '');

  if (!paymentId || !status) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }

  // Paiements confirmés / envoyés / finis = payés
  const paid = ['confirmed', 'sending', 'finished'].includes(status);

  if (paid) {
    const order = await prisma.order.findFirst({ where: { paymentId } });
    if (order && order.status === 'PENDING') {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'PAID', paidAt: new Date(), txId: String(data.payment_id || '') },
      });
      // Le bot livre automatiquement
      await prisma.botAction.create({
        data: { type: 'DELIVER_ORDER', payload: JSON.stringify({ orderId: order.id }) },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
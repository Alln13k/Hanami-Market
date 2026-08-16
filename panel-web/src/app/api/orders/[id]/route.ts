import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { product: true, delivery: true, stockItems: true },
  });
  if (!order) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
  return NextResponse.json(order);
}

// Confirmation manuelle du paiement (PayPal) -> déclenche la livraison côté bot
export async function POST(_req: NextRequest, { params }: Params) {
  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });

  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'PAID', paidAt: new Date() },
  });

  // Le bot surveille cette table et livre automatiquement
  await prisma.botAction.create({
    data: { type: 'DELIVER_ORDER', payload: JSON.stringify({ orderId: order.id }) },
  });

  return NextResponse.json({ ok: true });
}

// Annulation / remboursement
export async function DELETE(_req: NextRequest, { params }: Params) {
  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });

  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'REFUNDED' },
  });

  return NextResponse.json({ ok: true });
}
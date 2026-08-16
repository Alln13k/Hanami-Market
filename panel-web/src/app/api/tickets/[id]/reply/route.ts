import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: { id: string } };

export async function POST(req: NextRequest, { params }: Params) {
  const ticket = await prisma.ticket.findUnique({ where: { id: params.id } });
  if (!ticket) return NextResponse.json({ error: 'Ticket introuvable' }, { status: 404 });
  if (ticket.status === 'CLOSED') return NextResponse.json({ error: 'Ticket fermé' }, { status: 400 });

  const body = await req.json();
  const content = String(body.content || '').trim();
  if (!content) return NextResponse.json({ error: 'Contenu vide' }, { status: 400 });

  await prisma.botAction.create({
    data: {
      type: 'REPLY_TICKET',
      payload: JSON.stringify({ ticketId: ticket.id, content }),
    },
  });

  return NextResponse.json({ ok: true });
}
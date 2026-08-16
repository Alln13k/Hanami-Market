import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!ticket) return NextResponse.json({ error: 'Ticket introuvable' }, { status: 404 });
  return NextResponse.json(ticket);
}

export async function POST(_req: NextRequest, { params }: Params) {
  const ticket = await prisma.ticket.findUnique({ where: { id: params.id } });
  if (!ticket) return NextResponse.json({ error: 'Ticket introuvable' }, { status: 404 });

  // Le bot gère toute la fermeture : transcription, suppression du ticket et du salon
  await prisma.botAction.create({
    data: {
      type: 'CLOSE_TICKET',
      payload: JSON.stringify({ channelId: ticket.channelId, reason: 'Ticket fermé depuis le panel' }),
    },
  });

  return NextResponse.json({ ok: true });
}
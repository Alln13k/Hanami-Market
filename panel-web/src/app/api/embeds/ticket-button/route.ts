import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const channelId = String(body.channelId || '');
  if (!channelId) return NextResponse.json({ error: 'Salon requis' }, { status: 400 });

  const channel = await prisma.guildChannel.findUnique({ where: { channelId } });
  if (!channel) return NextResponse.json({ error: 'Salon introuvable (synchronise le bot)' }, { status: 400 });

  await prisma.botAction.create({
    data: {
      type: 'CREATE_TICKET_BUTTON',
      payload: JSON.stringify({
        channelId,
        title: String(body.title || '').slice(0, 256),
        description: String(body.description || ''),
        color: String(body.color || 'f49ecd'),
        imageUrl: String(body.imageUrl || ''),
        footer: String(body.footer || ''),
        buttonLabel: String(body.buttonLabel || 'Ouvrir un ticket').slice(0, 80),
      }),
    },
  });

  return NextResponse.json({ ok: true });
}
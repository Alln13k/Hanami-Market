import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const channelId = String(body.channelId || '');
  if (!channelId) return NextResponse.json({ error: 'Salon requis' }, { status: 400 });

  const channel = await prisma.guildChannel.findUnique({ where: { channelId } });
  if (!channel) return NextResponse.json({ error: 'Salon introuvable (synchronise le bot)' }, { status: 400 });

  await prisma.setting.upsert({
    where: { key: 'vouchChannelId' },
    update: { value: channelId },
    create: { key: 'vouchChannelId', value: channelId },
  });

  return NextResponse.json({ ok: true });
}
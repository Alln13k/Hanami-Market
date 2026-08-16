import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enqueueLeaderboardUpdate } from '@/lib/leaderboard';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const channelId = String(body.channelId || '');
  if (!channelId) return NextResponse.json({ error: 'Salon requis' }, { status: 400 });

  const channel = await prisma.guildChannel.findUnique({ where: { channelId } });
  if (!channel) return NextResponse.json({ error: 'Salon introuvable (synchronise le bot)' }, { status: 400 });

  await enqueueLeaderboardUpdate(channelId);
  return NextResponse.json({ ok: true });
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enqueueBotAction } from '@/lib/leaderboard';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const channelId = String(body.channelId || '');
  const title = String(body.title || '').trim() || 'Comment poster une vouch';
  const description = String(body.description || '').trim();

  if (!channelId) return NextResponse.json({ error: 'Salon requis' }, { status: 400 });
  if (!description) return NextResponse.json({ error: 'Écris le texte du tutoriel' }, { status: 400 });

  const channel = await prisma.guildChannel.findUnique({ where: { channelId } });
  if (!channel) return NextResponse.json({ error: 'Salon introuvable (synchronise le bot)' }, { status: 400 });

  for (const [key, value] of [
    ['vouchChannelId', channelId],
    ['vouchTutorialTitle', title],
    ['vouchTutorialDescription', description],
  ]) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  await enqueueBotAction('SEND_VOUCH_TUTORIAL', { channelId });
  return NextResponse.json({ ok: true });
}
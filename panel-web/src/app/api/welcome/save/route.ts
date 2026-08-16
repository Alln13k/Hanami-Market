import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enqueueBotAction } from '@/lib/leaderboard';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const channelId = String(body.channelId || '');
  const title = String(body.title || '').trim() || 'Bienvenue ! 🌸';
  const description = String(body.description || '').trim();
  const test = Boolean(body.test);

  if (!channelId) return NextResponse.json({ error: 'Salon requis' }, { status: 400 });

  for (const [key, value] of [
    ['welcomeChannelId', channelId],
    ['welcomeTitle', title],
    ['welcomeDescription', description],
  ]) {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  if (test) {
    await enqueueBotAction('SEND_WELCOME_TEST', { channelId });
  }

  return NextResponse.json({ ok: true, test });
}
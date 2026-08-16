import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enqueueBotAction } from '@/lib/leaderboard';

export const dynamic = 'force-dynamic';

export async function GET() {
  const giveaways = await prisma.giveaway.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { entries: true } }, giveawayWinners: { orderBy: { createdAt: 'asc' } } },
    take: 100,
  });
  return NextResponse.json(giveaways);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const channelId = String(body.channelId || '').trim();
  const title = String(body.title || '').trim();
  const prize = String(body.prize || '').trim();
  const description = String(body.description || '').trim();
  const durationMinutes = Math.max(1, parseInt(body.durationMinutes, 10) || 60);
  const winners = Math.max(1, Math.min(20, parseInt(body.winners, 10) || 1));
  const requiredRoleId = String(body.requiredRoleId || '').trim() || null;
  const bannedRoleIds = Array.isArray(body.bannedRoleIds) ? body.bannedRoleIds.filter(Boolean).map(String) : [];
  const minSpend = body.minSpend ? Math.max(0, parseFloat(body.minSpend)) : null;
  const boostersBonus = Math.max(0, parseInt(body.boostersBonus, 10) || 0);
  const maxParticipants = Math.max(0, parseInt(body.maxParticipants, 10) || 0);
  const announceChannelId = String(body.announceChannelId || '').trim() || null;
  const pingRoleId = String(body.pingRoleId || '').trim() || null;
  const dmMessage = String(body.dmMessage || '').trim();
  const deleteOnEnd = !!body.deleteOnEnd;

  if (!channelId) return NextResponse.json({ error: 'Choisis le salon du giveaway.' }, { status: 400 });
  if (!title) return NextResponse.json({ error: 'Le titre est requis.' }, { status: 400 });
  if (!prize) return NextResponse.json({ error: 'Le lot est requis.' }, { status: 400 });

  const channel = await prisma.guildChannel.findUnique({ where: { channelId } });
  if (!channel || !channel.isText) {
    return NextResponse.json({ error: 'Ce salon n\'est pas un salon texte disponible.' }, { status: 400 });
  }

  await enqueueBotAction('START_GIVEAWAY', {
    channelId,
    title,
    prize,
    description,
    durationMinutes,
    winners,
    requiredRoleId,
    bannedRoleIds,
    minSpend,
    boostersBonus,
    maxParticipants,
    announceChannelId,
    pingRoleId,
    dmMessage,
    deleteOnEnd,
  });
  return NextResponse.json({ ok: true });
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enqueueBotAction } from '@/lib/leaderboard';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const vouch = await prisma.vouch.findUnique({ where: { id: params.id } });
  if (!vouch) return NextResponse.json({ error: 'Vouch introuvable' }, { status: 404 });

  await enqueueBotAction('DELETE_VOUCH', { messageId: vouch.messageId, channelId: vouch.channelId });
  await prisma.vouch.delete({ where: { id: vouch.id } });

  return NextResponse.json({ ok: true });
}
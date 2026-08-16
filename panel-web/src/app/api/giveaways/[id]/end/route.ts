import { NextRequest, NextResponse } from 'next/server';
import { enqueueBotAction } from '@/lib/leaderboard';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  await enqueueBotAction('END_GIVEAWAY', { giveawayId: params.id });
  return NextResponse.json({ ok: true });
}
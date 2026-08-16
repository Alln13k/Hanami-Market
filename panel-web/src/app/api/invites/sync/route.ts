import { NextResponse } from 'next/server';
import { enqueueBotAction } from '@/lib/leaderboard';

export async function POST() {
  await enqueueBotAction('SYNC_INVITES');
  return NextResponse.json({ ok: true });
}
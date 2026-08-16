import { NextRequest, NextResponse } from 'next/server';
import { enqueueBotAction } from '@/lib/leaderboard';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const keep = Number(body.keep) || 20;
  await enqueueBotAction('BACKUP_SERVER', { keep });
  return NextResponse.json({ ok: true });
}
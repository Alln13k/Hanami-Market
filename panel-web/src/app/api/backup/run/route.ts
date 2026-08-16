import { NextRequest, NextResponse } from 'next/server';
import { enqueueBotAction } from '@/lib/leaderboard';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const note = String(body.note || '').trim().slice(0, 200);
  await enqueueBotAction('BACKUP_SERVER', { note });
  return NextResponse.json({ ok: true });
}
import { NextRequest, NextResponse } from 'next/server';
import { enqueueBotAction } from '@/lib/leaderboard';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const targetId = String(body.targetId || '').trim();
  const reason = String(body.reason || '').trim();

  if (!targetId) return NextResponse.json({ error: 'ID utilisateur requis' }, { status: 400 });

  await enqueueBotAction('KICK_USER', { targetId, reason });
  return NextResponse.json({ ok: true });
}
import { NextRequest, NextResponse } from 'next/server';
import { enqueueBotAction } from '@/lib/leaderboard';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const filename = String(body.filename || '');
  if (!filename) return NextResponse.json({ error: 'Fichier requis' }, { status: 400 });
  await enqueueBotAction('DELETE_BACKUP', { filename });
  return NextResponse.json({ ok: true });
}
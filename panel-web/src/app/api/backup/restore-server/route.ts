import { NextRequest, NextResponse } from 'next/server';
import { enqueueBotAction } from '@/lib/leaderboard';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const filename = String(body.filename || '');
  const guildId = String(body.guildId || '');
  if (!filename || !guildId) {
    return NextResponse.json({ error: 'Fichier et serveur cible requis' }, { status: 400 });
  }
  await enqueueBotAction('RESTORE_BACKUP', { filename, guildId });
  return NextResponse.json({ ok: true });
}
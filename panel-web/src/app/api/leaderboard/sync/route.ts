import { NextRequest, NextResponse } from 'next/server';
import { enqueueSyncBoosters, enqueueSyncRoles } from '@/lib/leaderboard';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const type = String(body.type || '');

  if (type === 'BOOSTERS') {
    await enqueueSyncBoosters();
    return NextResponse.json({ ok: true });
  }
  if (type === 'ROLES') {
    await enqueueSyncRoles();
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Type inconnu' }, { status: 400 });
}
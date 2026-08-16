import { NextRequest, NextResponse } from 'next/server';
import { enqueueAddSpend } from '@/lib/leaderboard';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const userId = String(body.userId || '').trim();
  const username = String(body.username || '').trim() || 'Utilisateur inconnu';
  const amount = Math.max(0, parseFloat(body.amount) || 0);

  if (!userId) return NextResponse.json({ error: 'ID utilisateur requis' }, { status: 400 });
  if (amount <= 0) return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });

  await enqueueAddSpend(userId, username, amount);
  return NextResponse.json({ ok: true });
}
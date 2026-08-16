import { NextRequest, NextResponse } from 'next/server';
import { checkPassword, createSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({}));
  if (!checkPassword(password || '')) {
    return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 });
  }
  await createSession();
  return NextResponse.json({ ok: true });
}
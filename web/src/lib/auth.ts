import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'crypto';

const SESSION_COOKIE = 'shop_session';
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 jours

function sign(value: string) {
  return createHmac('sha256', process.env.SESSION_SECRET || 'dev-secret')
    .update(value)
    .digest('hex');
}

export async function createSession() {
  const random = createHmac('sha256', Date.now().toString() + Math.random().toString() + Math.random().toString())
    .update('seed')
    .digest('hex');
  const cookie = `${random}.${sign(random)}`;
  (await cookies()).set(SESSION_COOKIE, cookie, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL / 1000,
    path: '/',
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

// Vérifie que le mot de passe est correct
export function checkPassword(password: string) {
  const expected = process.env.PANEL_PASSWORD || '';
  if (!expected) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function isLoggedIn() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value || '';
  const [value, sig] = token.split('.');
  if (!value || !sig) return false;
  const expected = createHmac('sha256', process.env.SESSION_SECRET || 'dev-secret')
    .update(value)
    .digest('hex');
  return expected === sig;
}
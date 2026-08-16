import { NextResponse, type NextRequest } from 'next/server';

async function sign(value: string, secret: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(value));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function middleware(req: NextRequest) {
  const secret = process.env.SESSION_SECRET || 'dev-secret';
  const token = req.cookies.get('shop_session')?.value || '';
  const [value, sig] = token.split('.');
  const expected = value ? await sign(value, secret) : '';
  const ok = Boolean(value) && sig === expected;

  const { pathname } = req.nextUrl;

  // Pages protégées : tout sauf la page de login
  if (!ok && pathname !== '/') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Si connecté et sur la page login -> rediriger vers le dashboard
  if (ok && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api/auth|favicon.ico|.*\\.(?:svg|png|jpg|ico)$).*)'],
};
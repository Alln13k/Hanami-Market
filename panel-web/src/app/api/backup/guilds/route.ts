import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const setting = await prisma.setting.findUnique({ where: { key: 'botGuilds' } });
  try {
    const guilds = setting?.value ? JSON.parse(setting.value) : [];
    return NextResponse.json(guilds);
  } catch {
    return NextResponse.json([]);
  }
}
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const channels = await prisma.guildChannel.findMany({
    where: { isText: true },
    orderBy: [{ position: 'asc' }],
  });
  return NextResponse.json(channels);
}
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const entries = await prisma.leaderboardEntry.findMany({
    orderBy: [{ totalSpend: 'desc' }, { updatedAt: 'asc' }],
    take: 100,
  });
  return NextResponse.json(entries);
}
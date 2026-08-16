import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const giveaways = await prisma.giveaway.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { entries: true } } },
    take: 100,
  });
  return NextResponse.json(giveaways);
}
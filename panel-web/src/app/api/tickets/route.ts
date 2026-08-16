import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { messages: true } } },
  });
  return NextResponse.json(tickets);
}
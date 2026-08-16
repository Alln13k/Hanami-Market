import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const proofs = await prisma.proof.findMany({
    orderBy: { number: 'desc' },
    take: 50,
    select: { id: true, number: true, mimeType: true, createdAt: true },
  });
  return NextResponse.json(proofs);
}
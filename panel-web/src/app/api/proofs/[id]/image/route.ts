import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const proof = await prisma.proof.findUnique({
    where: { id: Number(params.id) || 0 },
  });
  if (!proof) return NextResponse.json({ error: 'Preuve introuvable' }, { status: 404 });

  const bytes = new Uint8Array(proof.image);

  return new NextResponse(bytes, {
    headers: {
      'Content-Type': proof.mimeType,
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
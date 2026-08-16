import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enqueueScamUpdate } from '@/lib/scams';

type Params = { params: { id: string } };

export async function DELETE(_req: NextRequest, { params }: Params) {
  const scammer = await prisma.scammer.findUnique({ where: { id: params.id } });
  if (!scammer) return NextResponse.json({ error: 'Scammeur introuvable' }, { status: 404 });

  await prisma.scammer.delete({ where: { id: scammer.id } });

  await enqueueScamUpdate();

  return NextResponse.json({ ok: true });
}
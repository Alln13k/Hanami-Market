import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enqueueScamUpdate } from '@/lib/scams';

export const dynamic = 'force-dynamic';

export async function GET() {
  const scammers = await prisma.scammer.findMany({ orderBy: { addedAt: 'desc' } });
  return NextResponse.json(scammers);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = String(body.name || '').trim();
  if (!name) return NextResponse.json({ error: 'Nom requis' }, { status: 400 });

  const scammer = await prisma.scammer.create({
    data: {
      name: name.slice(0, 100),
      reason: String(body.reason || '').slice(0, 200),
    },
  });

  await enqueueScamUpdate();

  return NextResponse.json(scammer, { status: 201 });
}
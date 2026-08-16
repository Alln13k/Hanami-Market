import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enqueueBotAction } from '@/lib/leaderboard';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file');

  if (!file || typeof file === 'string' || !file.size) {
    return NextResponse.json({ error: 'Image requise' }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image trop lourde (max 8 Mo)' }, { status: 400 });
  }

  const channel = await prisma.setting.findUnique({ where: { key: 'proofChannelId' } });
  if (!channel?.value) {
    return NextResponse.json({ error: 'Choisis d\'abord le salon des preuves' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || 'image/png';

  const last = await prisma.proof.findFirst({ orderBy: { number: 'desc' } });
  const number = last ? last.number + 1 : 1;

  const proof = await prisma.proof.create({ data: { number, image: buffer, mimeType } });
  await enqueueBotAction('SEND_PROOF', { proofId: proof.id });

  return NextResponse.json({ ok: true, number }, { status: 201 });
}
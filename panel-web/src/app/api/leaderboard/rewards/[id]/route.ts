import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  const reward = await prisma.spendRole.findUnique({ where: { id: params.id } });
  if (!reward) return NextResponse.json({ error: 'Récompense introuvable' }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.spendRole.update({
    where: { id: reward.id },
    data: {
      name: String(body.name ?? reward.name),
      roleId: String(body.roleId ?? reward.roleId),
      threshold: body.threshold !== undefined ? Math.max(0, parseFloat(body.threshold) || 0) : reward.threshold,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const reward = await prisma.spendRole.findUnique({ where: { id: params.id } });
  if (!reward) return NextResponse.json({ error: 'Récompense introuvable' }, { status: 404 });

  await prisma.spendRole.delete({ where: { id: reward.id } });
  return NextResponse.json({ ok: true });
}
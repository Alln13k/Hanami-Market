import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rewards = await prisma.spendRole.findMany({ orderBy: { threshold: 'asc' } });
  return NextResponse.json(rewards);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = String(body.name || '').trim();
  const roleId = String(body.roleId || '');
  const threshold = Math.max(0, parseFloat(body.threshold) || 0);

  if (!name) return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
  if (!roleId) return NextResponse.json({ error: 'Rôle requis' }, { status: 400 });

  const reward = await prisma.spendRole.create({
    data: { name, roleId, threshold },
  });
  return NextResponse.json(reward, { status: 201 });
}
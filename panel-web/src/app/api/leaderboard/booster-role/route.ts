import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enqueueSyncBoosters } from '@/lib/leaderboard';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const roleId = String(body.roleId || '');
  if (!roleId) return NextResponse.json({ error: 'Rôle requis' }, { status: 400 });

  await prisma.setting.upsert({
    where: { key: 'boosterRoleId' },
    update: { value: roleId },
    create: { key: 'boosterRoleId', value: roleId },
  });

  await enqueueSyncBoosters();
  return NextResponse.json({ ok: true });
}
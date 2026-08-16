import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const roleId = String(body.roleId || '').trim();
  await prisma.setting.upsert({
    where: { key: 'vouchAllowedRoleId' },
    update: { value: roleId },
    create: { key: 'vouchAllowedRoleId', value: roleId },
  });
  return NextResponse.json({ ok: true });
}
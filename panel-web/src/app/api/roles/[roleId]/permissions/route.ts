import { NextRequest, NextResponse } from 'next/server';
import { enqueueRolePermissions } from '@/lib/roles';

type Params = { params: { roleId: string } };

export async function POST(req: NextRequest, { params }: Params) {
  const body = await req.json();
  const permissions = Number(body.permissions) || 0;
  if (permissions < 0) return NextResponse.json({ error: 'Permissions invalides' }, { status: 400 });

  await enqueueRolePermissions(params.roleId, permissions);

  return NextResponse.json({ ok: true });
}
import { NextRequest, NextResponse } from 'next/server';
import { enqueueAssignRole, enqueueRemoveRole } from '@/lib/roles';

type Params = { params: { roleId: string } };

export async function POST(req: NextRequest, { params }: Params) {
  const body = await req.json();
  const userId = String(body.userId || '');
  if (!userId) return NextResponse.json({ error: 'Membre requis' }, { status: 400 });

  await enqueueAssignRole(userId, params.roleId);

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const body = await req.json();
  const userId = String(body.userId || '');
  if (!userId) return NextResponse.json({ error: 'Membre requis' }, { status: 400 });

  await enqueueRemoveRole(userId, params.roleId);

  return NextResponse.json({ ok: true });
}
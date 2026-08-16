import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const commands = await prisma.customCommand.findMany({ orderBy: { createdAt: 'asc' } });
  return NextResponse.json(commands);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const trigger = String(body.trigger || '').trim();
  if (!trigger) return NextResponse.json({ error: 'Déclencheur requis' }, { status: 400 });

  const existing = await prisma.customCommand.findUnique({ where: { trigger } });
  if (existing) return NextResponse.json({ error: 'Ce déclencheur existe déjà' }, { status: 400 });

  const command = await prisma.customCommand.create({
    data: {
      trigger,
      roleId: String(body.roleId || '') || null,
      responseType: body.responseType === 'EMBED' ? 'EMBED' : 'TEXT',
      text: String(body.text || ''),
      title: String(body.title || '').slice(0, 256),
      description: String(body.description || ''),
      color: String(body.color || '5865F2').replace('#', ''),
      imageUrl: String(body.imageUrl || ''),
      footer: String(body.footer || ''),
    },
  });

  return NextResponse.json(command, { status: 201 });
}
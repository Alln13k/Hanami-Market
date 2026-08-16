import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeSteps } from '@/lib/commands';

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

  const steps = normalizeSteps(body.steps);
  const first = steps[0];

  const command = await prisma.customCommand.create({
    data: {
      trigger,
      roleId: String(body.roleId || '') || null,
      responseType: first.type,
      text: first.type === 'EMBED' ? '' : first.text,
      title: first.title,
      description: first.description,
      color: first.color,
      imageUrl: first.imageUrl,
      footer: first.footer,
      reactions: first.reactions,
      cooldown: Math.max(0, parseInt(body.cooldown, 10) || 0),
      deleteTrigger: Boolean(body.deleteTrigger),
      channelId: String(body.channelId || '') || null,
      steps: JSON.stringify(steps),
    },
  });

  return NextResponse.json(command, { status: 201 });
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeSteps } from '../route';

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const command = await prisma.customCommand.findUnique({ where: { id: params.id } });
  if (!command) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
  return NextResponse.json(command);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const command = await prisma.customCommand.findUnique({ where: { id: params.id } });
  if (!command) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });

  const body = await req.json();
  const trigger = String(body.trigger || command.trigger).trim();
  if (!trigger) return NextResponse.json({ error: 'Déclencheur requis' }, { status: 400 });

  const conflict = await prisma.customCommand.findFirst({
    where: { trigger, id: { not: command.id } },
  });
  if (conflict) return NextResponse.json({ error: 'Ce déclencheur existe déjà' }, { status: 400 });

  const steps = body.steps !== undefined ? normalizeSteps(body.steps) : JSON.parse(command.steps || '[]');
  const first = steps[0] || { type: command.responseType || 'TEXT', title: '', description: '', color: command.color, imageUrl: '', footer: '', text: '', reactions: '' };

  const updated = await prisma.customCommand.update({
    where: { id: command.id },
    data: {
      trigger,
      roleId: String(body.roleId ?? (command.roleId || '')) || null,
      responseType: first.type,
      text: first.type === 'EMBED' ? (command.text || '') : first.text,
      title: first.title,
      description: first.description,
      color: first.color,
      imageUrl: first.imageUrl,
      footer: first.footer,
      reactions: first.reactions,
      cooldown: body.cooldown !== undefined ? Math.max(0, parseInt(body.cooldown, 10) || 0) : command.cooldown,
      deleteTrigger: body.deleteTrigger !== undefined ? Boolean(body.deleteTrigger) : command.deleteTrigger,
      channelId: String(body.channelId ?? (command.channelId || '')) || null,
      steps: JSON.stringify(steps),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const command = await prisma.customCommand.findUnique({ where: { id: params.id } });
  if (!command) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });

  await prisma.customCommand.delete({ where: { id: command.id } });
  return NextResponse.json({ ok: true });
}
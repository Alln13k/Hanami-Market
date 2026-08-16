import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: { id: string } };

const TYPES = ['TEXT', 'EMBED', 'DM', 'DM_USER', 'REACT', 'DELETE'];

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

  const updated = await prisma.customCommand.update({
    where: { id: command.id },
    data: {
      trigger,
      roleId: String(body.roleId ?? (command.roleId || '')) || null,
      responseType: TYPES.includes(body.responseType) ? body.responseType : command.responseType,
      text: String(body.text ?? command.text),
      title: String(body.title ?? command.title).slice(0, 256),
      description: String(body.description ?? command.description),
      color: String(body.color ?? command.color).replace('#', ''),
      imageUrl: String(body.imageUrl ?? command.imageUrl),
      footer: String(body.footer ?? command.footer),
      reactions: String(body.reactions ?? command.reactions),
      cooldown: body.cooldown !== undefined ? Math.max(0, parseInt(body.cooldown, 10) || 0) : command.cooldown,
      deleteTrigger: body.deleteTrigger !== undefined ? Boolean(body.deleteTrigger) : command.deleteTrigger,
      channelId: String(body.channelId ?? (command.channelId || '')) || null,
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
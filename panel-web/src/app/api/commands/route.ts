import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const TYPES = ['TEXT', 'EMBED', 'DM', 'DM_USER', 'REACT', 'DELETE', 'WAIT'];

export function normalizeSteps(steps: unknown): { type: string; text: string; title: string; description: string; color: string; imageUrl: string; footer: string; reactions: string; wait: number }[] {
  if (!Array.isArray(steps)) {
    return [{ type: 'TEXT', text: '', title: '', description: '', color: 'f49ecd', imageUrl: '', footer: '', reactions: '', wait: 0 }];
  }
  const out = steps
    .map((s: any) => ({
      type: TYPES.includes(s?.type) ? s.type : 'TEXT',
      text: String(s?.text || ''),
      title: String(s?.title || '').slice(0, 256),
      description: String(s?.description || ''),
      color: String(s?.color || 'f49ecd').replace('#', ''),
      imageUrl: String(s?.imageUrl || ''),
      footer: String(s?.footer || ''),
      reactions: String(s?.reactions || ''),
      wait: Math.max(0, parseInt(s?.wait, 10) || 0),
    }))
    .filter((s) => !(s.type === 'WAIT' && s.wait <= 0));
  return out.length > 0 ? out : [{ type: 'TEXT', text: '', title: '', description: '', color: 'f49ecd', imageUrl: '', footer: '', reactions: '', wait: 0 }];
}

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
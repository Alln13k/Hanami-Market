import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const channelId = String(body.channelId || '');
  if (!channelId) return NextResponse.json({ error: 'Salon requis' }, { status: 400 });

  const channel = await prisma.guildChannel.findUnique({ where: { channelId } });
  if (!channel) return NextResponse.json({ error: 'Salon introuvable (synchronise le bot)' }, { status: 400 });

  const fields = Array.isArray(body.fields)
    ? body.fields
        .slice(0, 25)
        .map((f: unknown) => {
          const { name, value, inline } = (f || {}) as { name?: string; value?: string; inline?: boolean };
          if (!name || !value) return null;
          return { name: String(name).slice(0, 256), value: String(value).slice(0, 1024), inline: Boolean(inline) };
        })
        .filter(Boolean)
    : [];

  await prisma.botAction.create({
    data: {
      type: 'SEND_EMBED',
      payload: JSON.stringify({
        channelId,
        title: String(body.title || '').slice(0, 256),
        description: String(body.description || ''),
        color: String(body.color || '5865F2'),
        imageUrl: String(body.imageUrl || ''),
        footer: String(body.footer || ''),
        fields,
      }),
    },
  });

  return NextResponse.json({ ok: true });
}
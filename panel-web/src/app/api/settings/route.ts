import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const KEYS = [
  'guildId',
  'ticketCategoryId',
  'adminChannelId',
  'adminRoleId',
  'panelUrl',
  'ticketLogsChannelId',
  'ticketAutoCloseDays',
  'autoRoleId',
  'goodbyeChannelId',
  'goodbyeMessage',
  'memberCounterChannelId',
  'welcomeChannelId',
  'welcomeTitle',
  'welcomeDescription',
  'vouchChannelId',
  'proofChannelId',
  'productsEmbedChannelId',
  'leaderboardChannelId',
];

export async function GET() {
  const settings = await prisma.setting.findMany({ where: { key: { in: KEYS } } });
  const obj: Record<string, string> = {};
  for (const s of settings) obj[s.key] = s.value;
  return NextResponse.json(obj);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  for (const key of KEYS) {
    if (body[key] !== undefined) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(body[key]) },
        create: { key, value: String(body[key]) },
      });
    }
  }
  return NextResponse.json({ ok: true });
}
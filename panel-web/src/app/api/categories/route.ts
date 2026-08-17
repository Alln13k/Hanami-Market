import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enqueueProductsUpdate } from '@/lib/products';

export const dynamic = 'force-dynamic';

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: [{ position: 'asc' }, { name: 'asc' }] });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = String(body.name || '').trim();
  if (!name) return NextResponse.json({ error: 'Nom requis' }, { status: 400 });

  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) return NextResponse.json({ error: 'Cette catégorie existe déjà' }, { status: 400 });

  const max = await prisma.category.aggregate({ _max: { position: true } });
  const category = await prisma.category.create({
    data: { name: name.slice(0, 50), position: (max._max.position ?? -1) + 1 },
  });

  return NextResponse.json(category, { status: 201 });
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Ajoute un lot de stock (texte multi-lignes : un article par ligne)
export async function POST(req: NextRequest) {
  const { productId, lines } = await req.json();
  if (!productId || !Array.isArray(lines) || lines.length === 0) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }
  const items = lines.filter((l) => String(l || '').trim()).map((l) => ({
    productId,
    data: String(l).trim(),
  }));
  await prisma.stockItem.createMany({ data: items });
  return NextResponse.json({ ok: true, added: items.length }, { status: 201 });
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enqueueProductsUpdate } from '@/lib/products';

export const dynamic = 'force-dynamic';

export async function GET() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'asc' } });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = String(body.name || '').trim();
  if (!name) return NextResponse.json({ error: 'Nom requis' }, { status: 400 });

  const price = Math.max(0, parseFloat(body.price) || 0);
  const stock = Math.max(0, Math.floor(parseInt(body.stock, 10) || 0));

  const product = await prisma.product.create({
    data: {
      name,
      description: String(body.description || ''),
      price,
      stock,
      color: String(body.color || 'f49ecd').replace('#', ''),
    },
  });

  await enqueueProductsUpdate();

  return NextResponse.json(product, { status: 201 });
}
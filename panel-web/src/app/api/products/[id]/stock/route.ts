import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enqueueProductsUpdate } from '@/lib/products';

type Params = { params: { id: string } };

export async function POST(req: NextRequest, { params }: Params) {
  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 });

  const body = await req.json();
  const stock = Math.max(0, Math.floor(parseInt(body.stock, 10) || 0));

  const updated = await prisma.product.update({
    where: { id: product.id },
    data: { stock },
  });

  await enqueueProductsUpdate();

  return NextResponse.json(updated);
}
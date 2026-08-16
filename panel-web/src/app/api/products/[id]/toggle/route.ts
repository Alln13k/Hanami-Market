import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enqueueProductsUpdate } from '@/lib/products';

type Params = { params: { id: string } };

export async function POST(_req: NextRequest, { params }: Params) {
  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 });

  const updated = await prisma.product.update({
    where: { id: product.id },
    data: { isActive: !product.isActive },
  });

  await enqueueProductsUpdate();

  return NextResponse.json(updated);
}
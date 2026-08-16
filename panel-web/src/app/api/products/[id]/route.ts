import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enqueueProductsUpdate } from '@/lib/products';

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 });

  const body = await req.json();
  const name = String(body.name ?? product.name).trim() || product.name;

  const updated = await prisma.product.update({
    where: { id: product.id },
    data: {
      name,
      description: String(body.description ?? product.description),
      category: String(body.category ?? product.category),
      price: body.price !== undefined ? Math.max(0, parseFloat(body.price) || 0) : product.price,
      salePrice:
        body.salePrice !== undefined
          ? body.salePrice === '' || body.salePrice === null
            ? null
            : Math.max(0, parseFloat(body.salePrice) || 0)
          : product.salePrice,
      color: String(body.color ?? product.color).replace('#', ''),
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : product.isActive,
    },
  });

  await enqueueProductsUpdate();

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 });

  await prisma.product.delete({ where: { id: product.id } });

  await enqueueProductsUpdate();

  return NextResponse.json({ ok: true });
}
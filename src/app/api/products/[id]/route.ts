import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { stockItems: { orderBy: { createdAt: 'desc' } } },
  });
  if (!product) return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const body = await req.json();
  const product = await prisma.product.update({
    where: { id: params.id },
    data: {
      name: body.name ?? undefined,
      description: body.description ?? undefined,
      price: body.price !== undefined ? parseFloat(body.price) : undefined,
      category: body.category ?? undefined,
      imageUrl: body.imageUrl ?? undefined,
      color: body.color ? body.color.replace('#', '') : undefined,
      roleId: body.roleId ?? undefined,
      deliveryNote: body.deliveryNote ?? undefined,
      isActive: body.isActive ?? undefined,
    },
  });
  return NextResponse.json(product);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
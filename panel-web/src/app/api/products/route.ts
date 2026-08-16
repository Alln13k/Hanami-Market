import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { stockItems: { where: { isSold: false } } } } },
  });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const product = await prisma.product.create({
    data: {
      name: body.name,
      description: body.description || '',
      price: parseFloat(body.price) || 0,
      category: body.category || 'Produits',
      imageUrl: body.imageUrl || '',
      color: (body.color || '5865F2').replace('#', ''),
      roleId: body.roleId || null,
      deliveryNote: body.deliveryNote || '',
      isActive: body.isActive !== false,
    },
  });
  return NextResponse.json(product, { status: 201 });
}
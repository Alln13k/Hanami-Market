import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enqueueProductsUpdate } from '@/lib/products';

type Params = { params: { id: string } };

// Renomme une catégorie (tous les produits suivent)
export async function PATCH(req: NextRequest, { params }: Params) {
  const category = await prisma.category.findUnique({ where: { id: params.id } });
  if (!category) return NextResponse.json({ error: 'Catégorie introuvable' }, { status: 404 });

  const body = await req.json();
  const name = String(body.name || '').trim();
  if (!name) return NextResponse.json({ error: 'Nom requis' }, { status: 400 });

  const conflict = await prisma.category.findUnique({ where: { name } });
  if (conflict && conflict.id !== category.id) {
    return NextResponse.json({ error: 'Cette catégorie existe déjà' }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.category.update({ where: { id: category.id }, data: { name: name.slice(0, 50) } }),
    prisma.product.updateMany({ where: { category: category.name }, data: { category: name.slice(0, 50) } }),
  ]);

  await enqueueProductsUpdate();

  return NextResponse.json({ ok: true });
}

// Supprime une catégorie (les produits passent en « sans catégorie »)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const category = await prisma.category.findUnique({ where: { id: params.id } });
  if (!category) return NextResponse.json({ error: 'Catégorie introuvable' }, { status: 404 });

  await prisma.$transaction([
    prisma.category.delete({ where: { id: category.id } }),
    prisma.product.updateMany({ where: { category: category.name }, data: { category: '' } }),
  ]);

  await enqueueProductsUpdate();

  return NextResponse.json({ ok: true });
}
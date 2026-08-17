import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ProductEditForm } from './product-edit-form';
import { StockForm } from './stock-form';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id: params.id } }),
    prisma.category.findMany({ orderBy: { position: 'asc' } }),
  ]);
  if (!product) notFound();

  return (
    <>
      <h1 className="page-title">Produit — {product.name}</h1>
      <p className="page-sub">Prix, description et stock</p>

      <div className="card" style={{ maxWidth: 720, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>Modifier le produit</h2>
        <ProductEditForm product={product} categories={categories.map((c) => c.name)} />
      </div>

      <div className="card" style={{ maxWidth: 720 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>Stock (actuel : {product.stock})</h2>
        <StockForm productId={product.id} current={product.stock} />
      </div>

      <Link href="/products" className="muted" style={{ display: 'inline-block', marginTop: 16 }}>← Retour aux produits</Link>
    </>
  );
}
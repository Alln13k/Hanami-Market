import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ProductForm } from './product-form';
import { ToggleButton } from './toggle-button';
import { DeleteButton } from './delete-button';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { stockItems: { where: { isSold: false } } } } },
  });

  return (
    <>
      <h1 className="page-title">Produits</h1>
      <p className="page-sub">Gère ton catalogue : prix, stock, rôles à attribuer</p>

      <div className="grid">
        {products.map((p) => (
          <div className="card" key={p.id}>
            <div className="flex justify-between" style={{ marginBottom: 8 }}>
              <strong>{p.name}</strong>
              <span className={`badge ${p.isActive ? 'DELIVERED' : 'REFUNDED'}`}>
                {p.isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <p className="muted" style={{ fontSize: 13, minHeight: 38 }}>{p.description || '—'}</p>
            <p>
              💰 <b>${Number(p.price).toFixed(2)}</b>
              {' '}· 📦 <b>{p._count.stockItems}</b> en stock
            </p>
            <div className="flex">
              <Link className="btn btn-small" href={`/products/${p.id}`}>Gérer</Link>
              <ToggleButton id={p.id} active={p.isActive} />
              <DeleteButton id={p.id} />
            </div>
          </div>
        ))}
      </div>

      <ProductForm />
    </>
  );
}
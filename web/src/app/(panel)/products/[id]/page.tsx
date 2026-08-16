import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ProductEditForm } from './product-edit-form';
import { StockForm } from './stock-form';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { stockItems: { orderBy: { createdAt: 'desc' } } },
  });

  if (!product) return <p>Produit introuvable.</p>;

  const inStock = product.stockItems.filter((i) => !i.isSold).length;
  const sold = product.stockItems.filter((i) => i.isSold).length;

  return (
    <>
      <p><Link className="muted" href="/products">← Retour aux produits</Link></p>
      <h1 className="page-title">{product.name}</h1>
      <p className="page-sub">💰 ${Number(product.price).toFixed(2)} · 📦 {inStock} en stock · ✅ {sold} vendus</p>

      <div className="grid">
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: 18 }}>Modifier le produit</h2>
          <ProductEditForm product={product} />
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: 18 }}>Ajouter du stock</h2>
          <p className="muted" style={{ fontSize: 13 }}>Un article par ligne (code, compte, licence...)</p>
          <StockForm productId={product.id} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>Stock ({product.stockItems.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Contenu</th>
              <th>Statut</th>
              <th>Vendu le</th>
            </tr>
          </thead>
          <tbody>
            {product.stockItems.slice(0, 50).map((item) => (
              <tr key={item.id}>
                <td><code style={{ fontSize: 13 }}>{item.data}</code></td>
                <td>
                  <span className={`badge ${item.isSold ? 'DELIVERED' : 'PENDING'}`}>
                    {item.isSold ? 'Vendu' : 'Disponible'}
                  </span>
                </td>
                <td className="muted">{item.soldAt ? new Date(item.soldAt).toLocaleString('fr-FR') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
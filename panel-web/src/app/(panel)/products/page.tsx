import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Pin, Plus } from 'lucide-react';
import { ProductForm } from './product-form';
import { ToggleButton } from './toggle-button';
import { DeleteProductButton } from './delete-button';
import { PublishEmbedForm } from './publish-form';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const [products, channels] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.guildChannel.findMany({ where: { isText: true }, orderBy: [{ position: 'asc' }] }),
  ]);

  return (
    <>
      <h1 className="page-title">Produits & Stock</h1>
      <p className="page-sub">L'embed public se met à jour automatiquement à chaque changement.</p>

      <div className="card" style={{ maxWidth: 720, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><Pin size={16} /> Embed public</h2>
        <PublishEmbedForm channels={channels} />
      </div>

      <div className="card" style={{ maxWidth: 720, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><Plus size={16} /> Nouveau produit</h2>
        <ProductForm />
      </div>

      <div className="card" style={{ maxWidth: 720 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>Produits</h2>
        {products.length === 0 ? (
          <p className="muted">Aucun produit pour le moment.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Prix</th>
                <th>Stock</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.name}
                    {p.description && <div className="muted" style={{ fontSize: 12 }}>{p.description}</div>}
                  </td>
                  <td>
                    {p.salePrice ? (
                      <>
                        {Number(p.salePrice).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}{' '}
                        <s className="muted" style={{ fontSize: 12 }}>{Number(p.price).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</s>{' '}
                        <span className="badge badge-green">🔥 -{Math.round((1 - Number(p.salePrice) / Number(p.price)) * 100)}%</span>
                      </>
                    ) : (
                      Number(p.price).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
                    )}
                  </td>
                  <td><strong>{p.stock}</strong></td>
                  <td><span className={`badge ${p.isActive ? 'OPEN' : 'CLOSED'}`}>{p.isActive ? 'Affiché' : 'Masqué'}</span></td>
                  <td className="flex">
                    <Link href={`/products/${p.id}`} className="btn btn-secondary btn-small">Gérer</Link>
                    <ToggleButton id={p.id} active={p.isActive} />
                    <DeleteProductButton id={p.id} name={p.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Folder, Pin, Plus, Package } from 'lucide-react';
import { ProductForm } from './product-form';
import { CategoryForm } from './category-form';
import { CategoryList } from './category-list';
import { ToggleButton } from './toggle-button';
import { DeleteProductButton } from './delete-button';
import { PublishEmbedForm } from './publish-form';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const [products, channels, categories] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.guildChannel.findMany({ where: { isText: true }, orderBy: [{ position: 'asc' }] }),
    prisma.category.findMany({ orderBy: [{ position: 'asc' }, { name: 'asc' }] }),
  ]);

  // Groupement des produits par catégorie (ordre des catégories, « Autres » à la fin)
  const categoryNames = categories.map((c) => c.name);
  const others = products.filter((p) => !categoryNames.includes(p.category || ''));
  const grouped = [
    ...categories.map((c) => ({ name: c.name, items: products.filter((p) => p.category === c.name) })),
    ...(others.length ? [{ name: 'Autres', items: others }] : []),
  ].filter((g) => g.items.length > 0);

  return (
    <>
      <h1 className="page-title">Produits & Stock</h1>
      <p className="page-sub">Les produits s'affichent groupés par catégorie, sur une ligne chacun. L'embed se met à jour automatiquement.</p>

      <div className="card" style={{ maxWidth: 720, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><Folder size={16} /> Catégories</h2>
        <CategoryForm />
        <div style={{ marginTop: 16 }}>
          <CategoryList categories={categories} />
        </div>
      </div>

      <div className="card" style={{ maxWidth: 720, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><Pin size={16} /> Embed public</h2>
        <PublishEmbedForm channels={channels} />
      </div>

      <div className="card" style={{ maxWidth: 720, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><Plus size={16} /> Nouveau produit</h2>
        <ProductForm categories={categories.map((c) => c.name)} />
      </div>

      <div className="card" style={{ maxWidth: 720 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><Package size={16} /> Produits</h2>
        {products.length === 0 ? (
          <p className="muted">Aucun produit pour le moment.</p>
        ) : (
          grouped.map((g) => (
            <div key={g.name} style={{ marginBottom: 16 }}>
              <h3 style={{ margin: '8px 0 8px', fontSize: 15, color: 'var(--primary)' }}>📂 {g.name}</h3>
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
                  {g.items.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <span title={p.description || undefined}>{p.name}</span>
                        {p.description && <span className="muted" style={{ fontSize: 12, marginLeft: 6 }}>· {p.description.slice(0, 40)}{p.description.length > 40 ? '…' : ''}</span>}
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
            </div>
          ))
        )}
      </div>
    </>
  );
}
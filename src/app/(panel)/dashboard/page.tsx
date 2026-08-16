import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [totalOrders, pendingOrders, deliveredOrders, revenue, productCount, pendingActions] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.aggregate({ _sum: { amount: true }, where: { status: 'DELIVERED' } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.botAction.count({ where: { status: 'PENDING' } }),
    ]);

  const recentOrders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 8,
    include: { product: true },
  });

  return (
    <>
      <h1 className="page-title">Tableau de bord</h1>
      <p className="page-sub">Vue d'ensemble de ton shop</p>

      <div className="grid">
        <div className="card stat">
          <div className="value">{totalOrders}</div>
          <div className="label">Commandes totales</div>
        </div>
        <div className="card stat">
          <div className="value">{pendingOrders}</div>
          <div className="label">En attente de paiement</div>
        </div>
        <div className="card stat">
          <div className="value">{deliveredOrders}</div>
          <div className="label">Livrées</div>
        </div>
        <div className="card stat">
          <div className="value">${Number(revenue._sum.amount || 0).toFixed(2)}</div>
          <div className="label">Revenus (livrés)</div>
        </div>
        <div className="card stat">
          <div className="value">{productCount}</div>
          <div className="label">Produits actifs</div>
        </div>
        <div className="card stat">
          <div className="value">{pendingActions}</div>
          <div className="label">Actions bot en attente</div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: 18 }}>Dernières commandes</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Produit</th>
              <th>Acheteur</th>
              <th>Montant</th>
              <th>Méthode</th>
              <th>Statut</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((o) => (
              <tr key={o.id}>
                <td><code>{o.id.slice(0, 8)}…</code></td>
                <td>{o.product.name}</td>
                <td>{o.userName || o.userId}</td>
                <td>${Number(o.amount).toFixed(2)}</td>
                <td>{o.paymentMethod}</td>
                <td><span className={`badge ${o.status}`}>{o.status}</span></td>
                <td className="muted">{new Date(o.createdAt).toLocaleString('fr-FR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
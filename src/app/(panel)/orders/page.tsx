import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ConfirmButton } from './confirm-button';
import { StatusFilter } from './status-filter';

export const dynamic = 'force-dynamic';

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = searchParams.status || 'ALL';
  const where = status !== 'ALL' ? { status } : {};

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { product: true },
  });

  return (
    <>
      <h1 className="page-title">Commandes</h1>
      <p className="page-sub">Vérifie les paiements PayPal et suis les livraisons</p>

      <StatusFilter current={status} />

      <div className="card">
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><code>{o.id.slice(0, 8)}…</code></td>
                <td>{o.product.name}</td>
                <td>{o.userName || o.userId}</td>
                <td>${Number(o.amount).toFixed(2)}</td>
                <td>{o.paymentMethod}</td>
                <td><span className={`badge ${o.status}`}>{o.status}</span></td>
                <td className="muted">{new Date(o.createdAt).toLocaleString('fr-FR')}</td>
                <td>
                  <div className="flex">
                    <Link className="btn btn-small btn-secondary" href={`/orders/${o.id}`}>Détail</Link>
                    {o.status === 'PENDING' && o.paymentMethod === 'PAYPAL' && (
                      <ConfirmButton id={o.id} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
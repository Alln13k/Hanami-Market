import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { RefundButton } from './refund-button';

export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { product: true, delivery: true },
  });

  if (!order) return <p>Commande introuvable.</p>;

  return (
    <>
      <p><Link className="muted" href="/orders">← Retour aux commandes</Link></p>
      <h1 className="page-title">Commande {order.id}</h1>

      <div className="grid">
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: 18 }}>Informations</h2>
          <table>
            <tbody>
              <tr><th>Produit</th><td>{order.product.name}</td></tr>
              <tr><th>Acheteur</th><td>{order.userName} (<code>{order.userId}</code>)</td></tr>
              <tr><th>Montant</th><td>${Number(order.amount).toFixed(2)}</td></tr>
              <tr><th>Méthode</th><td>{order.paymentMethod}</td></tr>
              <tr><th>Statut</th><td><span className={`badge ${order.status}`}>{order.status}</span></td></tr>
              <tr><th>Créée le</th><td>{new Date(order.createdAt).toLocaleString('fr-FR')}</td></tr>
              {order.payAddress && <tr><th>Adresse LTC</th><td><code>{order.payAddress}</code></td></tr>}
              {order.payAmount !== null && <tr><th>Montant dû</th><td>{Number(order.payAmount)} {order.payCurrency}</td></tr>}
              {order.txId && <tr><th>Référence</th><td>{order.txId}</td></tr>}
            </tbody>
          </table>
          {order.status !== 'DELIVERED' && order.status !== 'REFUNDED' && (
            <div className="mt-4">
              <RefundButton id={order.id} />
            </div>
          )}
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: 18 }}>Livraison</h2>
          {order.delivery ? (
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                background: 'var(--panel-2)',
                padding: 16,
                borderRadius: 8,
                margin: 0,
              }}
            >
              {order.delivery.content}
            </pre>
          ) : (
            <p className="muted">Pas encore livrée.</p>
          )}
        </div>
      </div>
    </>
  );
}
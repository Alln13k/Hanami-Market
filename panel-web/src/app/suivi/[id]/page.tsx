import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function SuiviPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { product: true, delivery: true },
  });

  if (!order) {
    return (
      <main style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <p>Commande introuvable.</p>
      </main>
    );
  }

  const statusInfo: Record<string, { label: string; color: string }> = {
    PENDING: { label: '⏳ En attente de paiement', color: '#f5a623' },
    PAID: { label: '✅ Payée — livraison en cours', color: '#27ae60' },
    DELIVERED: { label: '🎉 Livrée', color: '#2ecc71' },
    FAILED: { label: '❌ Échouée (rupture de stock)', color: '#e74c3c' },
    REFUNDED: { label: '↩️ Remboursée', color: '#7f8c8d' },
  };

  const info = statusInfo[order.status] || statusInfo.PENDING;

  return (
    <main style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: '#0f1220', color: '#e8eaf0', fontFamily: 'system-ui' }}>
      <div style={{ maxWidth: 560, width: '100%', padding: 32 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>🛒 Suivi de commande</h1>
        <p style={{ color: '#9aa0b3' }}>Commande <code>{order.id}</code></p>

        <div style={{ background: '#1a1f36', borderRadius: 12, padding: 24, marginTop: 16 }}>
          <p style={{ fontWeight: 700 }}>{order.product.name}</p>
          <p style={{ color: '#9aa0b3', fontSize: 14 }}>
            Payée en <b>{order.paymentMethod}</b> — ${Number(order.amount).toFixed(2)}
          </p>
          <p style={{ color: info.color, fontWeight: 700, marginTop: 12 }}>{info.label}</p>

          {order.payAddress && order.status === 'PENDING' && (
            <div style={{ marginTop: 16, background: '#12162b', borderRadius: 8, padding: 12 }}>
              <p style={{ fontSize: 13, color: '#9aa0b3' }}>Envoie exactement <b>{String(order.payAmount)} {order.payCurrency}</b> à :</p>
              <code style={{ wordBreak: 'break-all', fontSize: 13 }}>{order.payAddress}</code>
            </div>
          )}

          {order.delivery && (
            <div style={{ marginTop: 16, background: '#12162b', borderRadius: 8, padding: 12 }}>
              <p style={{ fontSize: 13, color: '#9aa0b3' }}>📦 Contenu livré</p>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: 8 }}>{order.delivery.content}</pre>
            </div>
          )}
        </div>

        <p style={{ marginTop: 24, fontSize: 13, color: '#6b7280' }}>
          Une question ? Ouvre un ticket sur le serveur Discord.
        </p>
      </div>
    </main>
  );
}
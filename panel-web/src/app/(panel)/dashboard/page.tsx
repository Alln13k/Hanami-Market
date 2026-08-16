import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function formatEuro(value: { toString(): string } | number | string) {
  return Number(value).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

export default async function DashboardPage() {
  const [
    openTickets,
    transcripts,
    totalMessages,
    pendingActions,
    productCount,
    vouchCount,
    presentMembers,
  ] = await Promise.all([
    prisma.ticket.count({ where: { status: 'OPEN' } }),
    prisma.ticketTranscript.count(),
    prisma.ticketMessage.count(),
    prisma.botAction.count({ where: { status: 'PENDING' } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.vouch.count(),
    prisma.inviteJoin.count(),
    prisma.inviteJoin.count({ where: { leftAt: null } }),
  ]);

  const totals = await prisma.leaderboardEntry.aggregate({ _sum: { totalSpend: true } });
  const topSpenders = await prisma.leaderboardEntry.findMany({
    orderBy: { totalSpend: 'desc' },
    take: 5,
  });
  const maxSpend = topSpenders[0] ? Number(topSpenders[0].totalSpend) : 0;

  const recentTickets = await prisma.ticket.findMany({
    orderBy: { createdAt: 'desc' },
    take: 6,
    include: { _count: { select: { messages: true } } },
  });

  const recentVouches = await prisma.vouch.findMany({
    orderBy: { createdAt: 'desc' },
    take: 6,
  });

  return (
    <>
      <h1 className="page-title">Tableau de bord</h1>
      <p className="page-sub">Vue d'ensemble des ventes, tickets et actions du bot</p>

      <div className="grid">
        <div className="card stat">
          <div className="value">{vouchCount}</div>
          <div className="label">Vouches enregistrées</div>
        </div>
        <div className="card stat">
          <div className="value">{formatEuro(totals._sum.totalSpend || 0)}</div>
          <div className="label">Total dépensé (leaderboard)</div>
        </div>
        <div className="card stat">
          <div className="value">{productCount}</div>
          <div className="label">Produits affichés</div>
        </div>
        <div className="card stat">
          <div className="value">{presentMembers}</div>
          <div className="label">Arrivés par invitation (présents)</div>
        </div>
        <div className="card stat">
          <div className="value">{openTickets}</div>
          <div className="label">Tickets ouverts</div>
        </div>
        <div className="card stat">
          <div className="value">{transcripts}</div>
          <div className="label">Transcriptions archivées</div>
        </div>
        <div className="card stat">
          <div className="value">{totalMessages}</div>
          <div className="label">Messages de tickets</div>
        </div>
        <div className="card stat">
          <div className="value">{pendingActions}</div>
          <div className="label">Actions bot en attente</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: 18 }}>🏆 Top dépenses</h2>
          {topSpenders.length === 0 ? (
            <p className="muted">Aucune dépense enregistrée.</p>
          ) : (
            topSpenders.map((e, i) => (
              <div key={e.userId} style={{ marginBottom: 12 }}>
                <div className="flex justify-between" style={{ fontSize: 14, marginBottom: 4 }}>
                  <strong>{i + 1}. {e.username || e.userId}</strong>
                  <span>{formatEuro(e.totalSpend)}</span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${maxSpend ? Math.round((Number(e.totalSpend) / maxSpend) * 100) : 0}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: 18 }}>🌸 Dernières vouches</h2>
          {recentVouches.length === 0 ? (
            <p className="muted">Aucune vouch pour le moment.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Membre</th>
                  <th>Produit</th>
                  <th>Montant</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentVouches.map((v) => (
                  <tr key={v.id}>
                    <td>{v.userName}</td>
                    <td>{v.product} ×{v.quantity}</td>
                    <td>{formatEuro(v.price)}</td>
                    <td className="muted">{new Date(v.createdAt).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: 18 }}>Tickets ouverts récents</h2>
        {recentTickets.length === 0 ? (
          <p className="muted">Aucun ticket ouvert pour le moment.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Utilisateur</th>
                <th>Type</th>
                <th>Messages</th>
                <th>Ouvert le</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recentTickets.map((t) => (
                <tr key={t.id}>
                  <td><code>{t.id.slice(0, 8)}…</code></td>
                  <td>{t.userName || t.userId}</td>
                  <td>{t.type}</td>
                  <td>{t._count.messages}</td>
                  <td className="muted">{new Date(t.createdAt).toLocaleString('fr-FR')}</td>
                  <td><Link href={`/tickets/${t.id}`}>Ouvrir</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
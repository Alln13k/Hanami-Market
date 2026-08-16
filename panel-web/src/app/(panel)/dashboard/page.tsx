import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [openTickets, totalTickets, totalMessages, pendingActions] = await Promise.all([
    prisma.ticket.count({ where: { status: 'OPEN' } }),
    prisma.ticket.count(),
    prisma.ticketMessage.count(),
    prisma.botAction.count({ where: { status: 'PENDING' } }),
  ]);

  const recentTickets = await prisma.ticket.findMany({
    orderBy: { createdAt: 'desc' },
    take: 8,
    include: { _count: { select: { messages: true } } },
  });

  return (
    <>
      <h1 className="page-title">Tableau de bord</h1>
      <p className="page-sub">Vue d'ensemble des tickets et actions du bot</p>

      <div className="grid">
        <div className="card stat">
          <div className="value">{openTickets}</div>
          <div className="label">Tickets ouverts</div>
        </div>
        <div className="card stat">
          <div className="value">{totalTickets}</div>
          <div className="label">Tickets au total</div>
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

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: 18 }}>Derniers tickets</h2>
        {recentTickets.length === 0 ? (
          <p className="muted">Aucun ticket pour le moment.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Utilisateur</th>
                <th>Type</th>
                <th>Statut</th>
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
                  <td><span className={`badge ${t.status}`}>{t.status}</span></td>
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
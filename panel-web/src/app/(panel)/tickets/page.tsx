import { prisma } from '@/lib/prisma';
import { CloseTicketButton } from './close-ticket-button';

export const dynamic = 'force-dynamic';

export default async function TicketsPage() {
  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <>
      <h1 className="page-title">Tickets</h1>
      <p className="page-sub">Tickets d'achat et de support</p>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Utilisateur</th>
              <th>Type</th>
              <th>Salon</th>
              <th>Statut</th>
              <th>Ouvert le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr key={t.id}>
                <td><code>{t.id.slice(0, 8)}…</code></td>
                <td>{t.userName || t.userId}</td>
                <td>{t.type}</td>
                <td><code>{t.channelId}</code></td>
                <td><span className={`badge ${t.status}`}>{t.status}</span></td>
                <td className="muted">{new Date(t.createdAt).toLocaleString('fr-FR')}</td>
                <td>
                  {t.status === 'OPEN' && <CloseTicketButton id={t.id} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { CloseTicketButton } from '../close-ticket-button';
import { ReplyForm } from './reply-form';

export const dynamic = 'force-dynamic';

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });

  if (!ticket) notFound();

  return (
    <>
      <h1 className="page-title">Ticket {ticket.id.slice(0, 8)}…</h1>
      <p className="page-sub">Conversation entre le client et le staff</p>

      <div className="card" style={{ marginBottom: 20, maxWidth: 720 }}>
        <div className="row">
          <div>
            <label>Utilisateur</label>
            <p style={{ margin: '4px 0 0' }}>{ticket.userName} <span className="muted">({ticket.userId})</span></p>
          </div>
          <div>
            <label>Type</label>
            <p style={{ margin: '4px 0 0' }}>{ticket.type}</p>
          </div>
          <div>
            <label>Statut</label>
            <p style={{ margin: '4px 0 0' }}><span className={`badge ${ticket.status}`}>{ticket.status}</span></p>
          </div>
          <div>
            <label>Salon</label>
            <p style={{ margin: '4px 0 0' }}><code>{ticket.channelId}</code></p>
          </div>
        </div>
        <div className="flex mt-4 justify-between">
          <span className="muted" style={{ fontSize: 13 }}>
            Ouvert le {new Date(ticket.createdAt).toLocaleString('fr-FR')}
            {ticket.closedAt ? ` · Fermé le ${new Date(ticket.closedAt).toLocaleString('fr-FR')}` : ''}
          </span>
          {ticket.status === 'OPEN' && <CloseTicketButton id={ticket.id} />}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20, maxWidth: 720 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>Conversation</h2>
        {ticket.messages.length === 0 ? (
          <p className="muted">Aucun message enregistré.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ticket.messages.map((m) => (
              <div
                key={m.id}
                className="ticket-msg"
                style={{
                  background: m.authorType === 'STAFF' ? 'rgba(46,204,113,.08)' : m.authorType === 'BOT' ? 'rgba(244,158,205,.08)' : 'var(--panel-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '10px 14px',
                }}
              >
                <div className="flex" style={{ marginBottom: 6, gap: 8, justifyContent: 'space-between' }}>
                  <span className="flex" style={{ gap: 8 }}>
                    {m.avatarUrl ? (
                      <img src={m.avatarUrl} alt="" width={26} height={26} style={{ borderRadius: '50%' }} />
                    ) : (
                      <span className="avatar-fallback">{m.authorName?.charAt(0).toUpperCase() || '?'}</span>
                    )}
                    <strong>{m.authorName}</strong>
                    {m.authorType === 'STAFF' && <span className="badge OPEN">Staff</span>}
                    {m.authorType === 'BOT' && <span className="badge PENDING">Bot</span>}
                  </span>
                  <span className="muted" style={{ fontSize: 12 }}>
                    {new Date(m.createdAt).toLocaleString('fr-FR')}
                  </span>
                </div>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{m.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {ticket.status === 'OPEN' && (
        <div className="card" style={{ maxWidth: 720 }}>
          <ReplyForm ticketId={ticket.id} />
        </div>
      )}
    </>
  );
}
import { prisma } from '@/lib/prisma';
import { Shield, Ban, UserX, UserCheck, History } from 'lucide-react';
import { BanKickForm } from './ban-kick-form';
import { UnbanForm } from './unban-form';

export const dynamic = 'force-dynamic';

export default async function ModerationPage() {
  const [members, logs] = await Promise.all([
    prisma.member.findMany({ orderBy: { name: 'asc' }, take: 500 }),
    prisma.moderationLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
  ]);

  const typeIcon = (type: string) =>
    type === 'BAN' ? <Ban size={14} /> : type === 'KICK' ? <UserX size={14} /> : <UserCheck size={14} />;

  return (
    <>
      <h1 className="page-title">Modération</h1>
      <p className="page-sub">Ban et kick des membres depuis le panel : le bot applique la sanction sur Discord.</p>

      <div className="card" style={{ maxWidth: 760, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><Shield size={16} /> Ban / Kick</h2>
        <BanKickForm members={members} />
      </div>

      <div className="card" style={{ maxWidth: 760, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><UserCheck size={16} /> Débannir</h2>
        <UnbanForm />
      </div>

      <div className="card" style={{ maxWidth: 760 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><History size={16} /> Historique des sanctions</h2>
        {logs.length === 0 ? (
          <p className="muted">Aucune sanction pour le moment.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Cible</th>
                <th>Raison</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td><span className={`badge ${l.type === 'BAN' ? 'FAILED' : l.type === 'KICK' ? 'PENDING' : 'CLOSED'}`}>{l.type}</span></td>
                  <td>
                    <span className="flex">{typeIcon(l.type)} {l.targetName} <span className="muted" style={{ fontSize: 12 }}>({l.targetId})</span></span>
                  </td>
                  <td>{l.reason || '—'}</td>
                  <td className="muted">{new Date(l.createdAt).toLocaleString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
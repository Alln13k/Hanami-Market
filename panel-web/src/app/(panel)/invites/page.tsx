import { prisma } from '@/lib/prisma';
import { Link2, UserPlus, UserMinus, RefreshCw } from 'lucide-react';
import { RefreshInvitesButton } from './refresh-button';

export const dynamic = 'force-dynamic';

export default async function InvitesPage() {
  const [invites, joins] = await Promise.all([
    prisma.invite.findMany({ orderBy: { uses: 'desc' } }),
    prisma.inviteJoin.findMany({ orderBy: { joinedAt: 'desc' }, take: 100 }),
  ]);

  return (
    <>
      <h1 className="page-title">Invitations</h1>
      <p className="page-sub">Qui a créé chaque invitation, qui a rejoint via quelle invitation, et qui est reparti.</p>

      <div className="card" style={{ maxWidth: 760, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><Link2 size={16} /> Invitations du serveur</h2>
        {invites.length === 0 ? (
          <p className="muted">Aucune invitation détectée. Utilise le bouton ci-dessous pour synchroniser.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Créée par</th>
                <th>Salon</th>
                <th>Utilisations</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((inv) => (
                <tr key={inv.code}>
                  <td><code>{inv.code}</code></td>
                  <td>{inv.inviterId || '—'}</td>
                  <td>{inv.channelId || '—'}</td>
                  <td><strong>{inv.uses}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="mt-4">
          <RefreshInvitesButton />
        </div>
      </div>

      <div className="card" style={{ maxWidth: 760 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><UserPlus size={16} /> Arrivées via invitation</h2>
        {joins.length === 0 ? (
          <p className="muted">Aucune arrivée enregistrée pour le moment.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Membre</th>
                <th>Invitation</th>
                <th>Créée par</th>
                <th>Rejoint le</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {joins.map((j) => (
                <tr key={j.id}>
                  <td>
                    <span className="flex">
                      {j.avatarUrl ? <img src={j.avatarUrl} alt="" width={22} height={22} style={{ borderRadius: '50%' }} /> : null}
                      {j.userName}
                    </span>
                  </td>
                  <td><code>{j.inviteCode}</code></td>
                  <td>{j.inviterName || j.inviterId || '—'}</td>
                  <td className="muted">{new Date(j.joinedAt).toLocaleString('fr-FR')}</td>
                  <td>
                    {j.leftAt ? (
                      <span className="flex" style={{ color: 'var(--red)' }}>
                        <UserMinus size={14} /> Parti le {new Date(j.leftAt).toLocaleString('fr-FR')}
                      </span>
                    ) : (
                      <span className="badge OPEN">Présent</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
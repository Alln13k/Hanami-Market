import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Trophy, Pin, Plus, Gift, Sparkles, RotateCcw } from 'lucide-react';
import { AddSpendForm } from './add-spend-form';
import { PublishLeaderboardForm } from './publish-form';
import { RewardForm } from './reward-form';
import { DeleteRewardButton } from './delete-reward-button';
import { BoosterForm } from './booster-form';
import { SyncButtons } from './sync-buttons';

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  const [entries, rewards, roles, channels, boosterSetting] = await Promise.all([
    prisma.leaderboardEntry.findMany({ orderBy: [{ totalSpend: 'desc' }, { updatedAt: 'asc' }], take: 50 }),
    prisma.spendRole.findMany({ orderBy: { threshold: 'asc' } }),
    prisma.role.findMany({ orderBy: { position: 'desc' } }),
    prisma.guildChannel.findMany({ where: { isText: true }, orderBy: [{ position: 'asc' }] }),
    prisma.setting.findUnique({ where: { key: 'boosterRoleId' } }),
  ]);

  const roleName = (id: string | null) => {
    if (!id) return null;
    return roles.find((r) => r.roleId === id)?.name || id;
  };

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <>
      <h1 className="page-title">Leaderboard des dépenses</h1>
      <p className="page-sub">Le classement s'affiche en permanence dans le salon choisi et se met à jour à chaque dépense.</p>

      <div className="card" style={{ maxWidth: 760, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><Pin size={16} /> Embed public</h2>
        <PublishLeaderboardForm channels={channels} />
      </div>

      <div className="card" style={{ maxWidth: 760, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><Plus size={16} /> Ajouter une dépense</h2>
        <AddSpendForm />
        <p className="muted" style={{ margin: '8px 0 0', fontSize: 12 }}>
          Astuce : utilise aussi la commande slash <code>/addspend</code> directement sur Discord.
        </p>
      </div>

      <div className="card" style={{ maxWidth: 760, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><Trophy size={16} /> Classement</h2>
        {entries.length === 0 ? (
          <p className="muted">Aucune dépense enregistrée pour le moment.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Membre</th>
                <th>Total dépensé</th>
                <th>Rôle gagné</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={e.userId}>
                  <td>{medals[i] || `${i + 1}.`}</td>
                  <td><strong>{e.username || e.userId}</strong></td>
                  <td>{Number(e.totalSpend).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
                  <td>{roleName(e.roleId) ? <span className="badge OPEN">@{roleName(e.roleId)}</span> : <span className="muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ maxWidth: 760, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><Gift size={16} /> Paliers de récompense (rôles)</h2>
        <RewardForm roles={roles} />
        {rewards.length === 0 ? (
          <p className="muted" style={{ marginBottom: 0 }}>Aucun palier. Crée le premier ci-dessus : quand un membre atteint le seuil, il gagne le rôle.</p>
        ) : (
          <table style={{ marginTop: 12 }}>
            <thead>
              <tr>
                <th>Palier</th>
                <th>Seuil (€)</th>
                <th>Rôle</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rewards.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.name}</strong></td>
                  <td>{Number(r.threshold).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
                  <td>@{roleName(r.roleId) || r.roleId}</td>
                  <td className="flex">
                    <Link href={`/leaderboard/rewards/${r.id}`} className="btn btn-secondary btn-small">Modifier</Link>
                    <DeleteRewardButton id={r.id} name={r.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="muted" style={{ margin: '12px 0 0', fontSize: 12 }}>
          <RotateCcw size={12} /> Les nouveaux paliers s'appliquent à la prochaine dépense. Pour les appliquer tout de suite, re-vérifie les rôles ci-dessous.
        </p>
      </div>

      <div className="card" style={{ maxWidth: 760, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><Sparkles size={16} /> Rôle booster</h2>
        <BoosterForm roles={roles} current={boosterSetting?.value || ''} />
      </div>

      <div className="card" style={{ maxWidth: 760 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><RotateCcw size={16} /> Synchronisations</h2>
        <SyncButtons />
      </div>
    </>
  );
}
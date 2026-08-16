'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw, TimerOff } from 'lucide-react';

type GiveawayRow = {
  id: string;
  channelId: string;
  messageId: string;
  title: string;
  prize: string;
  description: string;
  winners: number;
  endsAt: Date;
  endedAt: Date | null;
  status: string;
  createdAt: Date;
  _count: { entries: number };
  giveawayWinners: { userId: string; userName: string }[];
};

function formatDuration(ms: number) {
  if (ms <= 0) return 'Bientôt terminé';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}j ${h}h ${m}min`;
  if (h > 0) return `${h}h ${m}min ${sec}s`;
  if (m > 0) return `${m}min ${sec}s`;
  return `${sec}s`;
}

export function GiveawayControls({ giveaways }: { giveaways: GiveawayRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  async function end(id: string) {
    setBusy(`end-${id}`);
    setFeedback('');
    const res = await fetch(`/api/giveaways/${id}/end`, { method: 'POST' });
    setBusy(null);
    if (res.ok) {
      setFeedback('Fin du giveaway demandée : le bot tire les gagnants maintenant.');
      setTimeout(() => setFeedback(''), 6000);
      setTimeout(() => router.refresh(), 6000);
    }
  }

  return (
    <div>
      {feedback && <p className="muted flex" style={{ margin: '0 0 12px', fontSize: 13 }}>✅ {feedback}</p>}
      {giveaways.length === 0 ? (
        <p className="muted">Aucun giveaway pour le moment. Lance-en un avec <code>/giveaway start</code> sur Discord.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Titre</th>
              <th>Prix</th>
              <th>Participants</th>
              <th>Gagnants</th>
              <th>Statut</th>
              <th>Fin prévue</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {giveaways.map((g) => (
              <tr key={g.id}>
                <td><strong>{g.title}</strong>{g.description ? <div className="muted" style={{ fontSize: 12 }}>{g.description}</div> : null}</td>
                <td>🎁 {g.prize}</td>
                <td>{g._count.entries}</td>
                <td>
                  {g.giveawayWinners.length > 0 ? (
                    <span style={{ fontSize: 13 }}>
                      {g.giveawayWinners.map((w) => w.userName).join(', ')}
                    </span>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>{g.winners}</td>
                <td>
                  {g.status === 'RUNNING' ? (
                    <span className="badge badge-green">En cours</span>
                  ) : (
                    <span className="badge">Terminé</span>
                  )}
                </td>
                <td className="muted">
                  {g.status === 'RUNNING' ? formatDuration(new Date(g.endsAt).getTime() - Date.now()) : new Date(g.endedAt ?? g.endsAt).toLocaleString('fr-FR')}
                </td>
                <td>
                  {g.status === 'RUNNING' && (
                    <button
                      type="button"
                      className="btn-red btn-small"
                      disabled={busy === `end-${g.id}`}
                      onClick={() => end(g.id)}
                      title="Terminer le giveaway maintenant"
                    >
                      {busy === `end-${g.id}` ? <Loader2 size={14} className="spin" /> : <TimerOff size={14} />}
                      Terminer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="flex" style={{ marginTop: 12 }}>
        <button type="button" className="btn-secondary" onClick={() => router.refresh()}>
          <RefreshCw size={16} /> Rafraîchir
        </button>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Server, Upload, Check, Loader2 } from 'lucide-react';

type Stats = Record<string, number>;

export function BackupControls() {
  const router = useRouter();
  const [runningBot, setRunningBot] = useState(false);
  const [botDone, setBotDone] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [result, setResult] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  async function runOnServer() {
    setRunningBot(true);
    setError('');
    const res = await fetch('/api/backup/run', { method: 'POST' });
    setRunningBot(false);
    if (res.ok) {
      setBotDone(true);
      setTimeout(() => setBotDone(false), 3000);
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || restoring) return;
    setRestoring(true);
    setError('');
    setResult(null);
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/backup/restore', { method: 'POST', body: form });
    setRestoring(false);
    if (res.ok) {
      const data = await res.json();
      setResult(data.stats);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Erreur pendant la restauration.');
    }
    e.target.value = '';
  }

  const items = result
    ? [
        ['Réglages', result.settings],
        ['Produits', result.products],
        ['Dépenses leaderboard', result.leaderboardEntries],
        ['Paliers', result.spendRoles],
        ['Preuves', result.proofs],
        ['Vouches', result.vouches],
        ['Commandes perso', result.customCommands],
        ['Membres', result.members],
        ['Salons', result.channels],
        ['Rôles', result.roles],
        ['Sanctions', result.moderationLogs],
        ['Invitations', result.invites],
        ['Arrivées', result.inviteJoins],
        ['Tickets', result.tickets],
        ['Messages', result.ticketMessages],
        ['Transcriptions', result.transcripts],
      ]
    : [];

  return (
    <div>
      <div className="flex" style={{ flexWrap: 'wrap', gap: 8 }}>
        <a className="btn-secondary flex" href="/api/backup/export" download>
          <Download size={16} /> Télécharger la sauvegarde (JSON)
        </a>
        <button type="button" className="btn-secondary" onClick={runOnServer} disabled={runningBot}>
          {runningBot ? <Loader2 size={16} className="spin" /> : <Server size={16} />}
          {runningBot ? 'Demande...' : 'Sauvegarder sur le serveur du bot'}
        </button>
        {botDone && <span className="muted flex" style={{ fontSize: 13 }}><Check size={14} /> Le bot écrit le fichier dans backups/</span>}
      </div>

      <div style={{ marginTop: 24 }}>
        <label>Restaurer une sauvegarde (fusionne les données existantes)</label>
        <input type="file" accept="application/json" onChange={onFile} disabled={restoring} />
        {restoring && <p className="muted" style={{ fontSize: 13 }}>Importation en cours...</p>}
      </div>

      {error && <p style={{ color: 'var(--red)', marginTop: 12, fontSize: 14 }}>{error}</p>}

      {result && (
        <div className="grid" style={{ marginTop: 16 }}>
          {items.map(([label, count]) => (
            <div key={String(label)} className="card stat">
              <div className="value">{count as number}</div>
              <div className="label">{label as string}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
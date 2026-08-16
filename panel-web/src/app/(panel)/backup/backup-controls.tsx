'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Server, Upload, Check, Loader2, Trash2, RotateCcw, RefreshCw, DatabaseBackup } from 'lucide-react';

type Guild = { id: string; name: string; memberCount?: number };
type BackupRow = {
  id: string;
  filename: string;
  size: number;
  guildId: string | null;
  guildName: string;
  note: string;
  createdAt: Date;
};

type Stats = Record<string, number>;

function fmtSize(bytes: number) {
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} Mo`;
  if (bytes > 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${bytes} o`;
}

export function BackupControls({ guilds, backups }: { guilds: Guild[]; backups: BackupRow[] }) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [restoreTarget, setRestoreTarget] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  async function run() {
    setBusy('run');
    setError('');
    await fetch('/api/backup/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ note }) });
    setBusy(null);
    setNote('');
    setFeedback('Sauvegarde demandée : le bot écrit le fichier dans le dossier BACKUP du serveur. Rafraîchis l\'historique dans quelques secondes.');
    setTimeout(() => setFeedback(''), 6000);
  }

  async function syncList() {
    setBusy('sync');
    await fetch('/api/backup/sync', { method: 'POST' });
    setBusy(null);
    setTimeout(() => router.refresh(), 6000);
  }

  async function remove(filename: string) {
    setBusy(`del-${filename}`);
    await fetch('/api/backup/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename }),
    });
    setBusy(null);
    setTimeout(() => router.refresh(), 6000);
  }

  async function restore(filename: string) {
    const guildId = restoreTarget[filename];
    if (!guildId) return setError('Choisis d\'abord le serveur cible pour cette sauvegarde.');
    setBusy(`res-${filename}`);
    setError('');
    const res = await fetch('/api/backup/restore-server', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, guildId }),
    });
    setBusy(null);
    if (res.ok) {
      setFeedback('Restauration lancée : le bot importe les données puis recrée rôles et salons sur le serveur choisi.');
      setTimeout(() => setFeedback(''), 6000);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Erreur pendant la restauration.');
    }
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || busy) return;
    setBusy('file');
    setError('');
    setResult(null);
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/backup/restore', { method: 'POST', body: form });
    setBusy(null);
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
        ['Preuves', result.proofs],
        ['Vouches', result.vouches],
        ['Commandes perso', result.customCommands],
        ['Salons', result.channels],
        ['Rôles', result.roles],
        ['Tickets', result.tickets],
        ['Transcriptions', result.transcripts],
      ]
    : [];

  return (
    <div>
      <div className="row">
        <div style={{ flex: 1 }}>
          <label>Note (optionnel)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="ex: avant mise à jour des produits" maxLength={200} />
        </div>
        <div>
          <label>&nbsp;</label>
          <button type="button" className="btn-green" onClick={run} disabled={busy === 'run'}>
            {busy === 'run' ? <Loader2 size={16} className="spin" /> : <Server size={16} />}
            Sauvegarder maintenant
          </button>
        </div>
      </div>
      <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
        Le bot écrit <code>BACKUP/backup-&lt;serveur&gt;-&lt;date&gt;.json</code> à la racine du serveur (dossier BACKUP). Tout est
        inclus : salons, rôles, membres, stats leaderboard par personne, produits, vouches, preuves, tickets, transcriptions, réglages.
      </p>

      {feedback && <p className="muted flex" style={{ margin: '10px 0 0', fontSize: 13 }}><Check size={14} /> {feedback}</p>}
      {error && <p style={{ color: 'var(--red)', margin: '10px 0 0', fontSize: 14 }}>{error}</p>}

      <h2 style={{ fontSize: 18, margin: '24px 0 12px' }}><DatabaseBackup size={16} /> Historique des sauvegardes</h2>
      {backups.length === 0 ? (
        <p className="muted">Aucune sauvegarde pour le moment. Clique sur « Sauvegarder maintenant ».</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Fichier</th>
              <th>Serveur source</th>
              <th>Taille</th>
              <th>Date</th>
              <th>Note</th>
              <th>Restaurer sur</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {backups.map((b) => (
              <tr key={b.id}>
                <td><code style={{ fontSize: 12 }}>{b.filename}</code></td>
                <td>{b.guildName || '—'}</td>
                <td>{fmtSize(b.size)}</td>
                <td className="muted">{new Date(b.createdAt).toLocaleString('fr-FR')}</td>
                <td className="muted">{b.note || '—'}</td>
                <td>
                  <select
                    value={restoreTarget[b.filename] || ''}
                    onChange={(e) => setRestoreTarget((m) => ({ ...m, [b.filename]: e.target.value }))}
                  >
                    <option value="">— Choisir un serveur —</option>
                    {guilds.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.memberCount ?? '?'} membres)
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <div className="flex">
                    <button
                      type="button"
                      className="btn-secondary btn-small"
                      disabled={busy === `res-${b.filename}`}
                      onClick={() => restore(b.filename)}
                      title="Restaurer sur le serveur choisi (recrée rôles et salons)"
                    >
                      <RotateCcw size={14} /> Restaurer
                    </button>
                    <button
                      type="button"
                      className="btn-red btn-small"
                      disabled={busy === `del-${b.filename}`}
                      onClick={() => remove(b.filename)}
                      title="Supprimer cette sauvegarde"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="flex" style={{ marginTop: 12 }}>
        <button type="button" className="btn-secondary" onClick={syncList} disabled={busy === 'sync'}>
          {busy === 'sync' ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
          Rafraîchir l'historique
        </button>
      </div>

      <h2 style={{ fontSize: 18, margin: '28px 0 12px' }}>Télécharger / Restaurer un fichier</h2>
      <div className="flex" style={{ flexWrap: 'wrap', gap: 8 }}>
        <a className="btn-secondary flex" href="/api/backup/export" download>
          <Download size={16} /> Télécharger la sauvegarde actuelle (JSON)
        </a>
        <label className="btn-secondary" style={{ cursor: 'pointer' }}>
          <Upload size={16} /> Restaurer un fichier…
          <input type="file" accept="application/json" onChange={onFile} style={{ display: 'none' }} />
        </label>
      </div>
      <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
        Le téléchargement exporte l'état actuel de la base. La restauration par fichier fusionne les données dans la base
        (utile si tu as perdu le serveur ou que tu veux repartir d'un export téléchargé).
      </p>

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
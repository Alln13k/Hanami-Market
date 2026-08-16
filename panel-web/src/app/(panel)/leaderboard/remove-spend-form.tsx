'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Check } from 'lucide-react';

type Entry = { userId: string; username: string; totalSpend: number };

export function RemoveSpendForm({ entries }: { entries: Entry[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ userId: '', amount: '' });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.userId.trim() || !form.amount || sending) return;
    setSending(true);
    setError('');
    const res = await fetch('/api/leaderboard/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSending(false);
    if (res.ok) {
      setForm({ userId: '', amount: '' });
      setDone(true);
      setTimeout(() => setDone(false), 3000);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Erreur lors du retrait.');
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="row">
        <div>
          <label>ID utilisateur Discord</label>
          <input
            value={form.userId}
            onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
            placeholder="123456789012345678"
            list="leaderboard-members"
          />
          <datalist id="leaderboard-members">
            {entries.map((en) => (
              <option key={en.userId} value={en.userId}>
                {en.username} — {Number(en.totalSpend).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </option>
            ))}
          </datalist>
        </div>
        <div>
          <label>Montant à retirer (€)</label>
          <input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="5" />
        </div>
      </div>
      <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
        Le pseudo est déjà enregistré sur le leaderboard : seul l'ID suffit. Le rôle récompense est rétrogradé si le total redescend sous un palier.
      </p>
      {error && <p style={{ color: 'var(--red)', margin: 0, fontSize: 14 }}>{error}</p>}
      <div>
        <button type="submit" disabled={sending || !form.userId.trim() || !form.amount} className="btn-red">
          {sending ? 'Retrait...' : <><Minus size={16} /> Retirer de la dépense</>}
        </button>
        {done && <span className="muted flex" style={{ fontSize: 13, marginLeft: 10 }}><Check size={14} /> Retiré (le bot met à jour)</span>}
      </div>
    </form>
  );
}
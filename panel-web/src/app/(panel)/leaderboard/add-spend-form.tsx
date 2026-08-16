'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Check } from 'lucide-react';

export function AddSpendForm() {
  const router = useRouter();
  const [form, setForm] = useState({ userId: '', username: '', amount: '' });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.userId.trim() || !form.amount || sending) return;
    setSending(true);
    setError('');
    const res = await fetch('/api/leaderboard/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSending(false);
    if (res.ok) {
      setForm({ userId: '', username: '', amount: '' });
      setDone(true);
      setTimeout(() => setDone(false), 3000);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Erreur lors de l\'ajout.');
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="row">
        <div>
          <label>ID utilisateur Discord</label>
          <input value={form.userId} onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))} placeholder="123456789012345678" />
        </div>
        <div>
          <label>Pseudo (affiché sur le leaderboard)</label>
          <input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} placeholder="Ex : Alln13k" />
        </div>
        <div>
          <label>Montant (€)</label>
          <input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} placeholder="3.57" />
        </div>
      </div>
      {error && <p style={{ color: 'var(--red)', margin: 0, fontSize: 14 }}>{error}</p>}
      <div>
        <button type="submit" disabled={sending || !form.userId.trim() || !form.amount}>
          {sending ? 'Ajout...' : <><Plus size={16} /> Ajouter la dépense</>}
        </button>
        {done && <span className="muted flex" style={{ fontSize: 13, marginLeft: 10 }}><Check size={14} /> Ajouté (le bot met à jour)</span>}
      </div>
    </form>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, Check } from 'lucide-react';

type Channel = { channelId: string; name: string };

export function GiveawayCreateForm({ channels }: { channels: Channel[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    channelId: '',
    title: '',
    prize: '',
    description: '',
    durationMinutes: '60',
    winners: '1',
  });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.channelId || !form.title.trim() || !form.prize.trim() || sending) return;
    setSending(true);
    setError('');
    const res = await fetch('/api/giveaways', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSending(false);
    if (res.ok) {
      setForm({ channelId: '', title: '', prize: '', description: '', durationMinutes: '60', winners: '1' });
      setDone(true);
      setTimeout(() => setDone(false), 4000);
      setTimeout(() => router.refresh(), 4000);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Erreur lors de la création.');
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="row">
        <div style={{ flex: 1 }}>
          <label>Salon du giveaway</label>
          <select value={form.channelId} onChange={(e) => setForm((f) => ({ ...f, channelId: e.target.value }))}>
            <option value="">— Choisir un salon texte —</option>
            {channels.map((c) => (
              <option key={c.channelId} value={c.channelId}>
                #{c.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label>Titre</label>
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex : Giveaway de lancement" />
        </div>
      </div>
      <div className="row">
        <div style={{ flex: 1 }}>
          <label>Lot à gagner</label>
          <input value={form.prize} onChange={(e) => setForm((f) => ({ ...f, prize: e.target.value }))} placeholder="Ex : Nitro 1 mois" />
        </div>
        <div style={{ flex: 1 }}>
          <label>Durée (minutes)</label>
          <input type="number" min="1" value={form.durationMinutes} onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))} />
        </div>
        <div>
          <label>Gagnants</label>
          <input type="number" min="1" max="20" value={form.winners} onChange={(e) => setForm((f) => ({ ...f, winners: e.target.value }))} style={{ maxWidth: 90 }} />
        </div>
      </div>
      <div>
        <label>Description (optionnel)</label>
        <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Ex : Règles, conditions..." />
      </div>
      {error && <p style={{ color: 'var(--red)', margin: '8px 0 0', fontSize: 14 }}>{error}</p>}
      <div style={{ marginTop: 8 }}>
        <button type="submit" className="btn-green" disabled={sending || !form.channelId || !form.title.trim() || !form.prize.trim()}>
          {sending ? 'Création...' : <><Gift size={16} /> Lancer le giveaway</>}
        </button>
        {done && <span className="muted flex" style={{ fontSize: 13, marginLeft: 10 }}><Check size={14} /> Giveaway lancé ! Le bot l'affiche dans le salon choisi.</span>}
      </div>
    </form>
  );
}
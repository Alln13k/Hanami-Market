'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Channel = { channelId: string; name: string };

export function PublishEmbedForm({ channels }: { channels: Channel[] }) {
  const router = useRouter();
  const [channelId, setChannelId] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!channelId || sending) return;
    setSending(true);
    setError('');
    const res = await fetch('/api/products/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId }),
    });
    setSending(false);
    if (res.ok) {
      setDone(true);
      setTimeout(() => setDone(false), 3000);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Erreur lors de la publication.');
    }
  }

  return (
    <form onSubmit={submit}>
      <div>
        <label>Salon où afficher l'embed des produits</label>
        <select value={channelId} onChange={(e) => setChannelId(e.target.value)}>
          <option value="">— Choisir un salon —</option>
          {channels.map((c) => (
            <option key={c.channelId} value={c.channelId}>
              #{c.name}
            </option>
          ))}
        </select>
      </div>
      {error && <p style={{ color: 'var(--red)', margin: 0, fontSize: 14 }}>{error}</p>}
      <div>
        <button type="submit" disabled={sending || !channelId}>
          {sending ? 'Publication...' : '📌 Publier / mettre à jour l\'embed'}
        </button>
        {done && <span className="muted" style={{ fontSize: 13, marginLeft: 10 }}>✅ Envoyé (le bot met à jour)</span>}
      </div>
    </form>
  );
}
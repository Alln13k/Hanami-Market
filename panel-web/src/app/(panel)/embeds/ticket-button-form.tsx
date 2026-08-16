'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Channel = { channelId: string; name: string };

export function TicketButtonForm({ channels }: { channels: Channel[] }) {
  const router = useRouter();
  const [channelId, setChannelId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('5865F2');
  const [imageUrl, setImageUrl] = useState('');
  const [buttonLabel, setButtonLabel] = useState('🎫 Ouvrir un ticket');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!channelId || sending) return;
    setSending(true);
    setError('');
    setDone(false);
    const res = await fetch('/api/embeds/ticket-button', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId, title, description, color, imageUrl, buttonLabel }),
    });
    setSending(false);
    if (res.ok) {
      setDone(true);
      setTimeout(() => setDone(false), 3000);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Erreur lors de l\'envoi.');
    }
  }

  return (
    <form onSubmit={submit}>
      <div>
        <label>Salon</label>
        <select value={channelId} onChange={(e) => setChannelId(e.target.value)}>
          <option value="">— Choisir un salon —</option>
          {channels.map((c) => (
            <option key={c.channelId} value={c.channelId}>
              #{c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="row">
        <div>
          <label>Titre</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={256} />
        </div>
        <div>
          <label>Couleur</label>
          <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="5865F2" maxLength={6} />
        </div>
      </div>

      <div>
        <label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
      </div>

      <div className="row">
        <div>
          <label>Image (URL, optionnel)</label>
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <label>Texte du bouton</label>
          <input value={buttonLabel} onChange={(e) => setButtonLabel(e.target.value)} maxLength={80} />
        </div>
      </div>

      {error && <p style={{ color: 'var(--red)', margin: 0, fontSize: 14 }}>{error}</p>}
      <div>
        <button type="submit" disabled={sending || !channelId}>
          {sending ? 'Envoi...' : '🎫 Publier'}
        </button>
        {done && <span className="muted" style={{ fontSize: 13, marginLeft: 10 }}>✅ Envoyé</span>}
      </div>
    </form>
  );
}
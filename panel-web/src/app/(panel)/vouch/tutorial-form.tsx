'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Check } from 'lucide-react';

export function VouchTutorialForm({
  initialTitle,
  initialDescription,
  channelId,
}: {
  initialTitle: string;
  initialDescription: string;
  channelId: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!channelId || sending) return;
    setSending(true);
    setError('');
    const res = await fetch('/api/vouch/tutorial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, channelId }),
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
        <label>Titre de l'embed du tutoriel</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Comment poster une vouch" maxLength={256} />
      </div>
      <div>
        <label>Texte du tutoriel (le bot le renverra sous chaque vouch)</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} />
      </div>
      {error && <p style={{ color: 'var(--red)', margin: 0, fontSize: 14 }}>{error}</p>}
      <div>
        <button type="submit" disabled={sending || !channelId}>
          {sending ? 'Envoi...' : <><Send size={16} /> Publier le tutoriel dans le salon</>}
        </button>
        {done && <span className="muted flex" style={{ fontSize: 13, marginLeft: 10 }}><Check size={14} /> Envoyé</span>}
      </div>
    </form>
  );
}
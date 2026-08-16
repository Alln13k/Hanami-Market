'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Send, Check } from 'lucide-react';

export function WelcomeForm({
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
  const [busy, setBusy] = useState<'SAVE' | 'TEST' | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(test: boolean) {
    if (busy) return;
    setBusy(test ? 'TEST' : 'SAVE');
    setError('');
    const res = await fetch('/api/welcome/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, channelId, test }),
    });
    setBusy(null);
    if (res.ok) {
      setDone(true);
      setTimeout(() => setDone(false), 3000);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Erreur lors de l\'enregistrement.');
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(false); }}>
      <div>
        <label>Titre de l'embed</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bienvenue ! 🌸" maxLength={256} />
      </div>
      <div>
        <label>Texte du message de bienvenue</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} />
      </div>
      <p className="muted" style={{ margin: 0, fontSize: 12 }}>
        Placeholders : <code>{'{user}'}</code> = mention du membre · <code>{'{username}'}</code> = son pseudo · <code>{'{server}'}</code> = nom du serveur.
      </p>
      {error && <p style={{ color: 'var(--red)', margin: 0, fontSize: 14 }}>{error}</p>}
      <div className="flex" style={{ flexWrap: 'wrap' }}>
        <button type="submit" disabled={!!busy || !channelId}>
          {busy === 'SAVE' ? 'Enregistrement...' : <><Save size={16} /> Enregistrer</>}
        </button>
        <button type="button" className="btn-secondary" disabled={!!busy || !channelId} onClick={() => submit(true)}>
          {busy === 'TEST' ? 'Envoi...' : <><Send size={16} /> Envoyer un test</>}
        </button>
        {done && <span className="muted flex" style={{ fontSize: 13 }}><Check size={14} /> Enregistré</span>}
      </div>
    </form>
  );
}
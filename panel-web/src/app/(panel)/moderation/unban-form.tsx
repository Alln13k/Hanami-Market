'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCheck } from 'lucide-react';

export function UnbanForm() {
  const router = useRouter();
  const [targetId, setTargetId] = useState('');
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!targetId.trim() || sending) return;
    setSending(true);
    setError('');
    const res = await fetch('/api/moderation/unban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId, reason }),
    });
    setSending(false);
    if (res.ok) {
      setDone(true);
      setTargetId('');
      setReason('');
      setTimeout(() => setDone(false), 3000);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Erreur.');
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="row">
        <div>
          <label>ID utilisateur</label>
          <input value={targetId} onChange={(e) => setTargetId(e.target.value)} placeholder="123456789012345678" />
        </div>
        <div>
          <label>Raison (optionnel)</label>
          <input value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      </div>
      {error && <p style={{ color: 'var(--red)', margin: 0, fontSize: 14 }}>{error}</p>}
      <div>
        <button type="submit" disabled={sending || !targetId.trim()} className="btn-green">
          <UserCheck size={16} /> {sending ? 'Demande...' : 'Débannir'}
        </button>
        {done && <span className="muted flex" style={{ fontSize: 13, marginLeft: 10 }}>Demande envoyée au bot</span>}
      </div>
    </form>
  );
}
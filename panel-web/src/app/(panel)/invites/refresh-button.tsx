'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Check } from 'lucide-react';

export function RefreshInvitesButton() {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function run() {
    if (sending) return;
    setSending(true);
    const res = await fetch('/api/invites/sync', { method: 'POST' });
    setSending(false);
    if (res.ok) {
      setDone(true);
      setTimeout(() => setDone(false), 3000);
      router.refresh();
    }
  }

  return (
    <span className="flex" style={{ flexWrap: 'wrap' }}>
      <button type="button" className="btn-secondary" onClick={run} disabled={sending}>
        <RefreshCw size={16} /> {sending ? 'Synchronisation...' : 'Synchroniser les invitations'}
      </button>
      {done && <span className="muted flex" style={{ fontSize: 13 }}><Check size={14} /> Envoyé au bot</span>}
    </span>
  );
}
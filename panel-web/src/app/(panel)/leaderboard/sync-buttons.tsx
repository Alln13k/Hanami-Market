'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Sparkles, Check } from 'lucide-react';

export function SyncButtons() {
  const router = useRouter();
  const [busy, setBusy] = useState<'ROLES' | 'BOOSTERS' | null>(null);
  const [done, setDone] = useState(false);

  async function run(type: 'ROLES' | 'BOOSTERS') {
    if (busy) return;
    setBusy(type);
    const res = await fetch('/api/leaderboard/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type }),
    });
    setBusy(null);
    if (res.ok) {
      setDone(true);
      setTimeout(() => setDone(false), 3000);
      router.refresh();
    }
  }

  return (
    <div className="flex" style={{ flexWrap: 'wrap' }}>
      <button className="btn-secondary" onClick={() => run('ROLES')} disabled={!!busy}>
        <RefreshCw size={16} /> {busy === 'ROLES' ? 'Application...' : 'Re-vérifier les rôles récompense'}
      </button>
      <button className="btn-secondary" onClick={() => run('BOOSTERS')} disabled={!!busy}>
        <Sparkles size={16} /> {busy === 'BOOSTERS' ? 'Synchronisation...' : 'Synchroniser les boosters'}
      </button>
      {done && <span className="muted flex" style={{ fontSize: 13 }}><Check size={14} /> Envoyé au bot</span>}
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ban, UserX } from 'lucide-react';

type Member = { userId: string; name: string };

export function BanKickForm({ members }: { members: Member[] }) {
  const router = useRouter();
  const [memberId, setMemberId] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<'BAN' | 'KICK' | null>(null);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');

  async function run(type: 'BAN' | 'KICK') {
    if (!memberId || busy) return;
    const targetId = memberId.startsWith('@') ? members.find((m) => m.name === memberId.slice(1))?.userId : memberId;
    if (!targetId) return setError('Membre introuvable');
    setBusy(type);
    setError('');
    setDone('');
    const res = await fetch(`/api/moderation/${type.toLowerCase()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId, reason }),
    });
    setBusy(null);
    if (res.ok) {
      setDone(type === 'BAN' ? 'Ban demandé, le bot s\'en occupe.' : 'Kick demandé, le bot s\'en occupe.');
      setMemberId('');
      setReason('');
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Erreur.');
    }
  }

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <div className="row">
        <div>
          <label>Membre</label>
          <select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
            <option value="">— Choisir un membre —</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.name} ({m.userId})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Raison (optionnel)</label>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Raison de la sanction" />
        </div>
      </div>
      {error && <p style={{ color: 'var(--red)', margin: 0, fontSize: 14 }}>{error}</p>}
      {done && <p className="muted" style={{ margin: 0, fontSize: 14 }}>{done}</p>}
      <div className="flex" style={{ flexWrap: 'wrap' }}>
        <button type="button" className="btn-red" disabled={!!busy || !memberId} onClick={() => run('KICK')}>
          <UserX size={16} /> {busy === 'KICK' ? 'Demande...' : 'Kick'}
        </button>
        <button type="button" className="btn-red" disabled={!!busy || !memberId} onClick={() => run('BAN')}>
          <Ban size={16} /> {busy === 'BAN' ? 'Demande...' : 'Ban'}
        </button>
      </div>
    </form>
  );
}
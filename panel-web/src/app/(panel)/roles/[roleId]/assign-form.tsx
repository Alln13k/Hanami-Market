'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Check } from 'lucide-react';

type Member = { userId: string; name: string; avatarUrl: string };

export function AssignRoleForm({ roleId, members, roleName }: { roleId: string; members: Member[]; roleName: string }) {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || sending) return;
    setSending(true);
    setError('');
    const res = await fetch(`/api/roles/${roleId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    setSending(false);
    if (res.ok) {
      setDone(true);
      setTimeout(() => setDone(false), 2500);
      setUserId('');
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Erreur lors de l\'attribution.');
    }
  }

  return (
    <form onSubmit={submit}>
      <div>
        <label>Attribuer le rôle "{roleName}" à un membre</label>
        <select value={userId} onChange={(e) => setUserId(e.target.value)}>
          <option value="">— Choisir un membre —</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      {error && <p style={{ color: 'var(--red)', margin: 0, fontSize: 14 }}>{error}</p>}
      <div>
        <button type="submit" disabled={sending || !userId}>
          {sending ? 'Envoi...' : <><UserPlus size={16} /> Attribuer le rôle</>}
        </button>
        {done && <span className="muted flex" style={{ fontSize: 13, marginLeft: 10 }}><Check size={14} /> Envoyé au bot</span>}
      </div>
    </form>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Check } from 'lucide-react';

type Role = { roleId: string; name: string };

export function BoosterForm({ roles, current }: { roles: Role[]; current: string }) {
  const router = useRouter();
  const [roleId, setRoleId] = useState(current);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!roleId || saving) return;
    setSaving(true);
    setError('');
    const res = await fetch('/api/leaderboard/booster-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleId }),
    });
    setSaving(false);
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
    <form onSubmit={submit}>
      <label>Rôle donné aux membres qui boostent le serveur</label>
      <select value={roleId} onChange={(e) => setRoleId(e.target.value)}>
        <option value="">— Aucun rôle booster —</option>
        {roles.map((r) => (
          <option key={r.roleId} value={r.roleId}>
            @{r.name}
          </option>
        ))}
      </select>
      {error && <p style={{ color: 'var(--red)', margin: 0, fontSize: 14 }}>{error}</p>}
      <div>
        <button type="submit" disabled={saving}>
          {saving ? 'Enregistrement...' : <><Sparkles size={16} /> Enregistrer + synchroniser</>}
        </button>
        {done && <span className="muted flex" style={{ fontSize: 13, marginLeft: 10 }}><Check size={14} /> Enregistré</span>}
      </div>
    </form>
  );
}
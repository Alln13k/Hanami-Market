'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Check } from 'lucide-react';

type Role = { roleId: string; name: string };

export function VouchRoleForm({ roles, initialRoleId }: { roles: Role[]; initialRoleId: string }) {
  const router = useRouter();
  const [roleId, setRoleId] = useState(initialRoleId);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    const res = await fetch('/api/vouch/role', {
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
      <div>
        <label>Rôle autorisé à poster des vouches</label>
        <select value={roleId} onChange={(e) => setRoleId(e.target.value)}>
          <option value="">— Tout le monde peut voter —</option>
          {roles.map((r) => (
            <option key={r.roleId} value={r.roleId}>
              {r.name}
            </option>
          ))}
        </select>
        <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
          Empêche le spam : seuls les membres avec ce rôle peuvent poster <code>+vouch</code> (et donc augmenter leur
          score sur le leaderboard). Les admins restent autorisés.
        </p>
      </div>
      {error && <p style={{ color: 'var(--red)', margin: 0, fontSize: 14 }}>{error}</p>}
      <div>
        <button type="submit" disabled={saving}>
          <ShieldCheck size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        {done && <span className="muted flex" style={{ fontSize: 13, marginLeft: 10 }}><Check size={14} /> Enregistré</span>}
      </div>
    </form>
  );
}
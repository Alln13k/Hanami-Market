'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Check } from 'lucide-react';

type Role = { roleId: string; name: string; color: string };

export function AutoRolesForm({ roles, current }: { roles: Role[]; current: string[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(current);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autoRoleIds: JSON.stringify(selected) }),
    });
    setSaving(false);
    if (res.ok) {
      setDone(true);
      setTimeout(() => setDone(false), 2500);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Erreur lors de l\'enregistrement.');
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="role-picker">
        {roles.map((r) => (
          <label key={r.roleId} className="role-chip">
            <input type="checkbox" checked={selected.includes(r.roleId)} onChange={() => toggle(r.roleId)} />
            <span style={{ color: r.color === '000000' || !r.color ? undefined : `#${r.color}` }}>{r.name}</span>
          </label>
        ))}
      </div>
      {error && <p style={{ color: 'var(--red)', margin: 0, fontSize: 14 }}>{error}</p>}
      <div>
        <button type="submit" disabled={saving}>
          {saving ? 'Enregistrement...' : <><Save size={16} /> Enregistrer les auto-rôles</>}
        </button>
        {done && <span className="muted flex" style={{ fontSize: 13, marginLeft: 10 }}><Check size={14} /> Enregistré</span>}
      </div>
    </form>
  );
}
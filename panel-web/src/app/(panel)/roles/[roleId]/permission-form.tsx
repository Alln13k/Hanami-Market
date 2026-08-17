'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Check } from 'lucide-react';
import { PERMISSIONS } from '@/lib/permissions';

export function PermissionForm({ roleId, bits }: { roleId: string; bits: bigint }) {
  const router = useRouter();
  const [selected, setSelected] = useState<bigint>(bits);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  function toggle(bit: number) {
    const b = BigInt(bit);
    setSelected((s) => (s & b ? s & ~b : s | b));
  }

  function selectAll() {
    setSelected(PERMISSIONS.reduce((acc, p) => acc | BigInt(p.bit), 0n));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    const res = await fetch(`/api/roles/${roleId}/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions: selected.toString() }),
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
      <div className="perm-grid">
        {PERMISSIONS.map((p) => {
          const checked = (selected & BigInt(p.bit)) !== 0n;
          return (
            <label key={p.bit} className={checked ? 'perm-item active' : 'perm-item'}>
              <input type="checkbox" checked={checked} onChange={() => toggle(p.bit)} />
              {p.label}
            </label>
          );
        })}
      </div>
      <div style={{ margin: '8px 0 0' }}>
        <button type="button" className="btn btn-secondary btn-small" onClick={selectAll}>Tout cocher</button>
      </div>
      {error && <p style={{ color: 'var(--red)', margin: 0, fontSize: 14 }}>{error}</p>}
      <div>
        <button type="submit" disabled={saving}>
          {saving ? 'Enregistrement...' : <><Save size={16} /> Appliquer les permissions</>}
        </button>
        {done && <span className="muted flex" style={{ fontSize: 13, marginLeft: 10 }}><Check size={14} /> Envoyé au bot</span>}
      </div>
    </form>
  );
}
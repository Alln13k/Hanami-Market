'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Check } from 'lucide-react';

type Role = { roleId: string; name: string };

export function RewardForm({ roles }: { roles: Role[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', roleId: '', threshold: '' });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.roleId || !form.threshold || saving) return;
    setSaving(true);
    setError('');
    const res = await fetch('/api/leaderboard/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setForm({ name: '', roleId: '', threshold: '' });
      setDone(true);
      setTimeout(() => setDone(false), 3000);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Erreur lors de la création.');
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="row">
        <div>
          <label>Nom du palier</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex : Acheteur Pro" />
        </div>
        <div>
          <label>Rôle Discord à donner</label>
          <select value={form.roleId} onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}>
            <option value="">— Choisir un rôle —</option>
            {roles.map((r) => (
              <option key={r.roleId} value={r.roleId}>
                @{r.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Seuil (€ dépensés au total)</label>
          <input type="number" min="0" step="0.01" value={form.threshold} onChange={(e) => setForm((f) => ({ ...f, threshold: e.target.value }))} placeholder="50" />
        </div>
      </div>
      {error && <p style={{ color: 'var(--red)', margin: 0, fontSize: 14 }}>{error}</p>}
      <div>
        <button type="submit" disabled={saving || !form.name.trim() || !form.roleId || !form.threshold}>
          {saving ? 'Création...' : <><Plus size={16} /> Créer le palier</>}
        </button>
        {done && <span className="muted flex" style={{ fontSize: 13, marginLeft: 10 }}><Check size={14} /> Créé (applique à la prochaine dépense)</span>}
      </div>
    </form>
  );
}
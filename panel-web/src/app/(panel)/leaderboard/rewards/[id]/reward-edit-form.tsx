'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Check } from 'lucide-react';

type Role = { roleId: string; name: string };

type Reward = {
  id: string;
  name: string;
  roleId: string;
  threshold: unknown;
};

export function RewardEditForm({ reward, roles }: { reward: Reward; roles: Role[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: reward.name,
    roleId: reward.roleId,
    threshold: String(reward.threshold),
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.roleId || saving) return;
    setSaving(true);
    setError('');
    const res = await fetch(`/api/leaderboard/rewards/${reward.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setDone(true);
      setTimeout(() => setDone(false), 2000);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Erreur lors de l\'enregistrement.');
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="row">
        <div>
          <label>Nom du palier</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label>Rôle Discord</label>
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
          <label>Seuil (€)</label>
          <input type="number" min="0" step="0.01" value={form.threshold} onChange={(e) => setForm((f) => ({ ...f, threshold: e.target.value }))} />
        </div>
      </div>
      {error && <p style={{ color: 'var(--red)', margin: 0, fontSize: 14 }}>{error}</p>}
      <div>
        <button type="submit" disabled={saving || !form.name.trim() || !form.roleId}>
          {saving ? 'Enregistrement...' : <><Save size={16} /> Enregistrer</>}
        </button>
        {done && <span className="muted flex" style={{ fontSize: 13, marginLeft: 10 }}><Check size={14} /> Enregistré</span>}
      </div>
    </form>
  );
}
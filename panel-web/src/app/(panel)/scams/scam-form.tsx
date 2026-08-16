'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Skull } from 'lucide-react';

export function ScamForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || saving) return;
    setSaving(true);
    setError('');
    const res = await fetch('/api/scammers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setForm({ name: '', reason: '' });
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Erreur lors de l\'ajout.');
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="row">
        <div>
          <label>Nom Discord du scammeur</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Ex : Jean.azerty"
          />
        </div>
        <div>
          <label>Raison (optionnel)</label>
          <input
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            placeholder="Ex : a pris l'argent sans livrer"
          />
        </div>
      </div>
      {error && <p style={{ color: 'var(--red)', margin: 0, fontSize: 14 }}>{error}</p>}
      <div>
        <button type="submit" disabled={saving || !form.name.trim()}>
          {saving ? 'Ajout...' : <><Skull size={16} /> Signaler un scammeur</>}
        </button>
      </div>
    </form>
  );
}
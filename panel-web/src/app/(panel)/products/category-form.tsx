'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderPlus } from 'lucide-react';

export function CategoryForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    setError('');
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    setSaving(false);
    if (res.ok) {
      setName('');
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Erreur lors de la création.');
    }
  }

  return (
    <form onSubmit={submit} className="row">
      <div>
        <label>Nouvelle catégorie</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Boosters" />
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
        <button type="submit" disabled={saving || !name.trim()}>
          {saving ? 'Création...' : <><FolderPlus size={16} /> Créer</>}
        </button>
      </div>
      {error && <p style={{ color: 'var(--red)', margin: 0, fontSize: 14 }}>{error}</p>}
    </form>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Check } from 'lucide-react';

type Category = { id: string; name: string };

export function CategoryList({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [renaming, setRenaming] = useState<string | null>(null);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function rename(id: string) {
    if (!value.trim() || saving) return;
    setSaving(true);
    setError('');
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: value }),
    });
    setSaving(false);
    if (res.ok) {
      setRenaming(null);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Erreur.');
    }
  }

  async function remove(c: Category) {
    if (!confirm(`Supprimer la catégorie "${c.name}" ?\nLes produits passeront en « sans catégorie ».`)) return;
    const res = await fetch(`/api/categories/${c.id}`, { method: 'DELETE' });
    if (res.ok) router.refresh();
  }

  return (
    <div>
      {categories.length === 0 ? (
        <p className="muted">Aucune catégorie pour le moment.</p>
      ) : (
        <table>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td>
                  {renaming === c.id ? (
                    <input value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
                  ) : (
                    <strong>{c.name}</strong>
                  )}
                </td>
                <td className="flex" style={{ justifyContent: 'flex-end' }}>
                  {renaming === c.id ? (
                    <button className="btn btn-secondary btn-small" disabled={saving} onClick={() => rename(c.id)}>
                      <Check size={14} /> OK
                    </button>
                  ) : (
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => {
                        setRenaming(c.id);
                        setValue(c.name);
                      }}
                    >
                      <Pencil size={14} /> Renommer
                    </button>
                  )}
                  <button className="btn-red btn-small" onClick={() => remove(c)}>
                    <Trash2 size={14} /> Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {error && <p style={{ color: 'var(--red)', margin: 0, fontSize: 14 }}>{error}</p>}
    </div>
  );
}
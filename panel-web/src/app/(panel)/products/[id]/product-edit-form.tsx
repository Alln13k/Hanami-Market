'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Check } from 'lucide-react';

type Product = {
  id: string;
  name: string;
  description: string;
  price: unknown;
  color: string;
};

export function ProductEditForm({ product }: { product: Product }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: product.name,
    description: product.description,
    price: String(product.price),
    color: product.color,
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || saving) return;
    setSaving(true);
    setError('');
    const res = await fetch(`/api/products/${product.id}`, {
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
          <label>Nom du produit</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div>
          <label>Prix (€)</label>
          <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} />
        </div>
      </div>
      <div>
        <label>Description</label>
        <input value={form.description} onChange={(e) => set('description', e.target.value)} />
      </div>
      <div>
        <label>Couleur</label>
        <input value={form.color} onChange={(e) => set('color', e.target.value)} placeholder="f49ecd" maxLength={6} />
      </div>
      {error && <p style={{ color: 'var(--red)', margin: 0, fontSize: 14 }}>{error}</p>}
      <div>
        <button type="submit" disabled={saving || !form.name.trim()}>
          {saving ? 'Enregistrement...' : <><Save size={16} /> Enregistrer</>}
        </button>
        {done && <span className="muted flex" style={{ fontSize: 13, marginLeft: 10 }}><Check size={14} /> Enregistré</span>}
      </div>
    </form>
  );
}
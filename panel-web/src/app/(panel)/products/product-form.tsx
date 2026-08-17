'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';

export function ProductForm({ categories }: { categories: string[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', description: '', category: '', price: '', salePrice: '', stock: '', color: 'f49ecd' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || saving) return;
    setSaving(true);
    setError('');
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setForm({ name: '', description: '', category: '', price: '', salePrice: '', stock: '', color: 'f49ecd' });
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
          <label>Nom du produit</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex : Nitro 1 mois" />
        </div>
        <div>
          <label>Catégorie</label>
          <input list="product-categories" value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="Choisir ou écrire une catégorie" />
          <datalist id="product-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label>Prix (€)</label>
          <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="9.99" />
        </div>
        <div>
          <label>Prix promo 🔥 (optionnel)</label>
          <input type="number" min="0" step="0.01" value={form.salePrice} onChange={(e) => set('salePrice', e.target.value)} placeholder="7.99" />
        </div>
        <div>
          <label>Stock initial</label>
          <input type="number" min="0" step="1" value={form.stock} onChange={(e) => set('stock', e.target.value)} placeholder="10" />
        </div>
      </div>
      <div>
        <label>Description (optionnel)</label>
        <input value={form.description} onChange={(e) => set('description', e.target.value)} />
      </div>
      <div>
        <label>Couleur</label>
        <input value={form.color} onChange={(e) => set('color', e.target.value)} placeholder="f49ecd" maxLength={6} />
      </div>
      {error && <p style={{ color: 'var(--red)', margin: 0, fontSize: 14 }}>{error}</p>}
      <div>
        <button type="submit" disabled={saving || !form.name.trim()}>
          {saving ? 'Création...' : <><Plus size={16} /> Créer le produit</>}
        </button>
      </div>
    </form>
  );
}
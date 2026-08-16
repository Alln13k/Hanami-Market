'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Product = {
  id: string;
  name: string;
  description: string;
  price: unknown;
  category: string;
  imageUrl: string;
  color: string;
  roleId: string | null;
  deliveryNote: string;
  isActive: boolean;
};

export function ProductEditForm({ product }: { product: Product }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: product.name,
    description: product.description,
    price: String(product.price ?? 0),
    category: product.category,
    imageUrl: product.imageUrl,
    color: product.color,
    roleId: product.roleId || '',
    deliveryNote: product.deliveryNote,
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`/api/products/${product.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    router.refresh();
  }

  return (
    <form onSubmit={submit}>
      <div className="row">
        <div>
          <label>Nom</label>
          <input value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div>
          <label>Prix (USD)</label>
          <input type="number" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} />
        </div>
      </div>
      <div>
        <label>Description</label>
        <textarea value={form.description} onChange={(e) => set('description', e.target.value)} />
      </div>
      <div className="row">
        <div>
          <label>Catégorie</label>
          <input value={form.category} onChange={(e) => set('category', e.target.value)} />
        </div>
        <div>
          <label>Couleur (hex)</label>
          <input value={form.color} onChange={(e) => set('color', e.target.value)} />
        </div>
      </div>
      <div className="row">
        <div>
          <label>URL image</label>
          <input value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} />
        </div>
        <div>
          <label>ID du rôle à attribuer</label>
          <input value={form.roleId} onChange={(e) => set('roleId', e.target.value)} placeholder="123456789012345678" />
        </div>
      </div>
      <div>
        <label>Note livrée avec le produit</label>
        <input value={form.deliveryNote} onChange={(e) => set('deliveryNote', e.target.value)} />
      </div>
      <button type="submit">💾 Enregistrer</button>
    </form>
  );
}
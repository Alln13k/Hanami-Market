'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ProductForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Produits',
    imageUrl: '',
    color: '5865F2',
    roleId: '',
    deliveryNote: '',
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setOpen(false);
    setForm({ name: '', description: '', price: '', category: 'Produits', imageUrl: '', color: '5865F2', roleId: '', deliveryNote: '' });
    router.refresh();
  }

  if (!open) {
    return <button onClick={() => setOpen(true)}>➕ Ajouter un produit</button>;
  }

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <h2 style={{ marginTop: 0, fontSize: 18 }}>Nouveau produit</h2>
      <form onSubmit={submit}>
        <div className="row">
          <div>
            <label>Nom</label>
            <input required value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div>
            <label>Prix (USD)</label>
            <input required type="number" step="0.01" min="0" value={form.price} onChange={(e) => set('price', e.target.value)} />
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
            <label>Couleur de l&apos;embed (hex)</label>
            <input value={form.color} onChange={(e) => set('color', e.target.value)} placeholder="5865F2" />
          </div>
        </div>
        <div className="row">
          <div>
            <label>URL image (optionnel)</label>
            <input value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} />
          </div>
          <div>
            <label>ID du rôle attribué après achat</label>
            <input value={form.roleId} onChange={(e) => set('roleId', e.target.value)} placeholder="123456789012345678" />
          </div>
        </div>
        <div>
          <label>Note livrée avec le produit (optionnel)</label>
          <input value={form.deliveryNote} onChange={(e) => set('deliveryNote', e.target.value)} />
        </div>
        <div className="flex">
          <button type="submit">Créer</button>
          <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Annuler</button>
        </div>
      </form>
    </div>
  );
}
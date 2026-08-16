'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Check } from 'lucide-react';

export function StockForm({ productId, current }: { productId: string; current: number }) {
  const router = useRouter();
  const [stock, setStock] = useState(String(current));
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    const res = await fetch(`/api/products/${productId}/stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock }),
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
      <label>Stock</label>
      <div className="flex">
        <input
          type="number"
          min="0"
          step="1"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          style={{ maxWidth: 160 }}
        />
        <button type="submit" disabled={saving} className="btn-green">
          {saving ? 'Mise à jour...' : <><Save size={16} /> Définir le stock</>}
        </button>
        {done && <span className="muted flex" style={{ fontSize: 13 }}><Check size={14} /> Enregistré</span>}
      </div>
      {error && <p style={{ color: 'var(--red)', margin: 0, fontSize: 14 }}>{error}</p>}
    </form>
  );
}
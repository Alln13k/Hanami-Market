'use client';

import { useRouter } from 'next/navigation';

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  async function remove() {
    if (!confirm(`Supprimer le produit "${name}" ?`)) return;
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) router.refresh();
  }
  return (
    <button className="btn-red btn-small" onClick={remove}>
      Supprimer
    </button>
  );
}
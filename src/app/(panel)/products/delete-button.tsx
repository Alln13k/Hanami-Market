'use client';

import { useRouter } from 'next/navigation';

export function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  async function del() {
    if (!confirm('Supprimer ce produit définitivement ?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    router.refresh();
  }
  return (
    <button className="btn-red btn-small" onClick={del}>🗑️</button>
  );
}
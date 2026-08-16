'use client';

import { useRouter } from 'next/navigation';

export function DeleteCommandButton({ id, trigger }: { id: string; trigger: string }) {
  const router = useRouter();
  async function remove() {
    if (!confirm(`Supprimer la commande "${trigger}" ?`)) return;
    const res = await fetch(`/api/commands/${id}`, { method: 'DELETE' });
    if (res.ok) router.refresh();
  }
  return (
    <button className="btn-red btn-small" onClick={remove}>
      Supprimer
    </button>
  );
}
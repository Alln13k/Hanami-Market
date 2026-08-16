'use client';

import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

export function DeleteVouchButton({ id, targetName }: { id: string; targetName: string }) {
  const router = useRouter();
  async function remove() {
    if (!confirm(`Supprimer la vouch de ${targetName} ? Le message sera aussi supprimé sur Discord.`)) return;
    const res = await fetch(`/api/vouch/${id}`, { method: 'DELETE' });
    if (res.ok) router.refresh();
  }
  return (
    <button className="btn-red btn-small" onClick={remove}>
      <Trash2 size={14} /> Supprimer
    </button>
  );
}
'use client';

import { useRouter } from 'next/navigation';

export function RemoveScammerButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  async function remove() {
    if (!confirm(`Retirer "${name}" de la liste des scammeurs ?`)) return;
    const res = await fetch(`/api/scammers/${id}`, { method: 'DELETE' });
    if (res.ok) router.refresh();
  }
  return (
    <button className="btn-red btn-small" onClick={remove}>
      Retirer
    </button>
  );
}
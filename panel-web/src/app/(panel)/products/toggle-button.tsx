'use client';

import { useRouter } from 'next/navigation';

export function ToggleButton({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  async function toggle() {
    await fetch(`/api/products/${id}/toggle`, { method: 'POST' });
    router.refresh();
  }
  return (
    <button className={active ? 'btn-red btn-small' : 'btn-green btn-small'} onClick={toggle}>
      {active ? 'Masquer' : 'Afficher'}
    </button>
  );
}
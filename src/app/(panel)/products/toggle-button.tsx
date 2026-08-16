'use client';

import { useRouter } from 'next/navigation';

export function ToggleButton({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  async function toggle() {
    await fetch(`/api/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !active }),
    });
    router.refresh();
  }
  return (
    <button className="btn-secondary btn-small" onClick={toggle}>
      {active ? 'Désactiver' : 'Activer'}
    </button>
  );
}
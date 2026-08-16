'use client';

import { useRouter } from 'next/navigation';

export function RefundButton({ id }: { id: string }) {
  const router = useRouter();
  async function refund() {
    if (!confirm('Marquer cette commande comme remboursée ?')) return;
    await fetch(`/api/orders/${id}`, { method: 'DELETE' });
    router.refresh();
  }
  return (
    <button className="btn-red btn-small" onClick={refund}>
      ↩️ Marquer remboursée
    </button>
  );
}
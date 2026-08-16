'use client';

import { useRouter } from 'next/navigation';

export function ConfirmButton({ id }: { id: string }) {
  const router = useRouter();
  async function doConfirm() {
    if (!window.confirm('Confirmer le paiement de cette commande PayPal ?')) return;
    await fetch(`/api/orders/${id}`, { method: 'POST' });
    router.refresh();
  }
  return (
    <button className="btn-green btn-small" onClick={doConfirm}>
      ✔ Confirmer paiement
    </button>
  );
}
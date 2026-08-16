'use client';

import { useRouter } from 'next/navigation';

export function CloseTicketButton({ id }: { id: string }) {
  const router = useRouter();
  async function close() {
    if (!confirm('Fermer ce ticket ? Le salon Discord sera supprimé.')) return;
    await fetch(`/api/tickets/${id}`, { method: 'POST' });
    router.refresh();
  }
  return (
    <button className="btn-red btn-small" onClick={close}>
      🔒 Fermer
    </button>
  );
}
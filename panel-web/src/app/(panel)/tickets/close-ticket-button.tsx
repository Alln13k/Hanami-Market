'use client';

import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

export function CloseTicketButton({ id }: { id: string }) {
  const router = useRouter();
  async function close() {
    if (!confirm('Fermer ce ticket ? Le salon Discord sera supprimé et une transcription sera archivée.')) return;
    await fetch(`/api/tickets/${id}`, { method: 'POST' });
    router.refresh();
  }
  return (
    <button className="btn-red btn-small flex" onClick={close}>
      <Lock size={14} /> Fermer
    </button>
  );
}
'use client';

import { useRouter } from 'next/navigation';
import { UserMinus } from 'lucide-react';

export function RemoveRoleButton({ roleId, userId, name }: { roleId: string; userId: string; name: string }) {
  const router = useRouter();
  async function remove() {
    if (!confirm(`Retirer le rôle de "${name}" ?`)) return;
    const res = await fetch(`/api/roles/${roleId}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) router.refresh();
  }
  return (
    <button className="btn-red btn-small" onClick={remove}>
      <UserMinus size={14} /> Retirer
    </button>
  );
}
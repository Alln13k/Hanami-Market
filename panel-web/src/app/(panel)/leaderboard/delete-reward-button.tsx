'use client';

import { useRouter } from 'next/navigation';

export function DeleteRewardButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  async function remove() {
    if (!confirm(`Supprimer le palier "${name}" ? Les rôles déjà donnés ne seront pas retirés.`)) return;
    const res = await fetch(`/api/leaderboard/rewards/${id}`, { method: 'DELETE' });
    if (res.ok) router.refresh();
  }
  return (
    <button className="btn-red btn-small" onClick={remove}>
      Supprimer
    </button>
  );
}
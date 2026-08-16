'use client';

import { useRouter } from 'next/navigation';

export function StatusFilter({ current }: { current: string }) {
  const router = useRouter();
  const options = ['ALL', 'PENDING', 'PAID', 'DELIVERED', 'FAILED', 'REFUNDED'];

  return (
    <div className="flex" style={{ marginBottom: 16 }}>
      {options.map((s) => (
        <button
          key={s}
          className={`btn btn-small ${current === s ? '' : 'btn-secondary'}`}
          onClick={() => router.push(s === 'ALL' ? '/orders' : `/orders?status=${s}`)}
        >
          {s === 'ALL' ? 'Toutes' : s}
        </button>
      ))}
    </div>
  );
}
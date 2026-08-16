'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function StockForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [lines, setLines] = useState('');
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const split = lines.split('\n').map((l) => l.trim()).filter(Boolean);
    if (split.length === 0) return;
    await fetch(`/api/products/${productId}/stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, lines: split }),
    });
    setLines('');
    setDone(true);
    setTimeout(() => setDone(false), 2000);
    router.refresh();
  }

  return (
    <form onSubmit={submit}>
      <textarea
        value={lines}
        onChange={(e) => setLines(e.target.value)}
        placeholder={'code-1@example.com:motdepasse\ncode-2@example.com:motdepasse\n...'}
        style={{ minHeight: 120 }}
      />
      <button type="submit">📦 Ajouter au stock</button>
      {done && <p className="muted" style={{ margin: 0, fontSize: 13 }}>✅ Stock ajouté !</p>}
    </form>
  );
}
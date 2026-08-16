'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ReplyForm({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || sending) return;
    setSending(true);
    setError('');
    const res = await fetch(`/api/tickets/${ticketId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: content.trim() }),
    });
    setSending(false);
    if (res.ok) {
      setContent('');
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Erreur lors de l\'envoi.');
    }
  }

  return (
    <form onSubmit={submit}>
      <label>Répondre au client (sera envoyé dans le salon Discord)</label>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Votre réponse..."
        rows={4}
      />
      {error && <p style={{ color: 'var(--red)', margin: 0, fontSize: 14 }}>{error}</p>}
      <div>
        <button type="submit" disabled={sending || !content.trim()}>
          {sending ? 'Envoi...' : '📨 Envoyer'}
        </button>
      </div>
    </form>
  );
}
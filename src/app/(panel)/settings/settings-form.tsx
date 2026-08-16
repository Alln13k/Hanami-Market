'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SettingsForm({ initial }: { initial: Record<string, string> }) {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>(initial);
  const [saved, setSaved] = useState(false);

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  const fields: { key: string; label: string; hint?: string }[] = [
    { key: 'guildId', label: 'ID du serveur Discord' },
    { key: 'adminChannelId', label: 'ID du salon admin (logs)' },
    { key: 'ticketCategoryId', label: 'ID de la catégorie Tickets' },
    { key: 'adminRoleId', label: 'ID du rôle admin' },
    { key: 'panelUrl', label: 'URL du panel', hint: 'ex: https://mon-shop.vercel.app' },
  ];

  return (
    <form onSubmit={submit}>
      {fields.map((f) => (
        <div key={f.key}>
          <label>{f.label}</label>
          <input value={form[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} placeholder={f.hint} />
        </div>
      ))}
      <div className="flex">
        <button type="submit">💾 Enregistrer</button>
        {saved && <span className="muted" style={{ fontSize: 13 }}>✅ Enregistré</span>}
      </div>
    </form>
  );
}
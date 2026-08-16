'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Check } from 'lucide-react';

type Channel = { channelId: string; name: string };

export function SettingsForm({ initial, channels }: { initial: Record<string, string>; channels: Channel[] }) {
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

      <div>
        <label>Salon des transcriptions de tickets (logs)</label>
        <select
          value={form.ticketLogsChannelId || ''}
          onChange={(e) => set('ticketLogsChannelId', e.target.value)}
        >
          <option value="">— Désactivé —</option>
          {channels.map((c) => (
            <option key={c.channelId} value={c.channelId}>
              #{c.name} ({c.channelId})
            </option>
          ))}
        </select>
        <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>Le bot y envoie la transcription (.txt) quand un ticket se ferme.</p>
      </div>

      <div>
        <label>Auto-fermeture des tickets inactifs (jours)</label>
        <input
          type="number"
          min={0}
          value={form.ticketAutoCloseDays || '7'}
          onChange={(e) => set('ticketAutoCloseDays', e.target.value)}
        />
        <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>0 = désactivé. Les tickets sans message depuis ce nombre de jours sont fermés automatiquement.</p>
      </div>

      <div className="flex">
        <button type="submit"><Save size={16} /> Enregistrer</button>
        {saved && <span className="muted flex" style={{ fontSize: 13 }}><Check size={14} /> Enregistré</span>}
      </div>
    </form>
  );
}
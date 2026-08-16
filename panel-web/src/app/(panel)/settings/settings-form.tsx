'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Check } from 'lucide-react';

type Channel = { channelId: string; name: string };
type Role = { roleId: string; name: string };

export function SettingsForm({ initial, channels, roles }: { initial: Record<string, string>; channels: Channel[]; roles: Role[] }) {
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
        <select value={form.ticketLogsChannelId || ''} onChange={(e) => set('ticketLogsChannelId', e.target.value)}>
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

      <h3 style={{ fontSize: 15, marginTop: 24, marginBottom: 4 }}>Communauté</h3>

      <div>
        <label>Rôle automatique à l'arrivée (auto-rôle)</label>
        <select value={form.autoRoleId || ''} onChange={(e) => set('autoRoleId', e.target.value)}>
          <option value="">— Aucun —</option>
          {roles.map((r) => (
            <option key={r.roleId} value={r.roleId}>@{r.name}</option>
          ))}
        </select>
        <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>Attribué automatiquement à chaque nouveau membre.</p>
      </div>

      <div>
        <label>Salon des messages d'adieu</label>
        <select value={form.goodbyeChannelId || ''} onChange={(e) => set('goodbyeChannelId', e.target.value)}>
          <option value="">— Désactivé —</option>
          {channels.map((c) => (
            <option key={c.channelId} value={c.channelId}>#{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label>Message d'adieu</label>
        <input
          value={form.goodbyeMessage || ''}
          onChange={(e) => set('goodbyeMessage', e.target.value)}
          placeholder="Placeholders : {user} {username} {server}"
        />
      </div>

      <div>
        <label>Compteur de membres (salon vocal)</label>
        <select value={form.memberCounterChannelId || ''} onChange={(e) => set('memberCounterChannelId', e.target.value)}>
          <option value="">— Désactivé —</option>
          {channels.map((c) => (
            <option key={c.channelId} value={c.channelId}>#{c.name}</option>
          ))}
        </select>
        <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>Le bot renomme ce salon vocal chaque minute : « 👥 Membres : X ».</p>
      </div>

      <div className="flex">
        <button type="submit"><Save size={16} /> Enregistrer</button>
        {saved && <span className="muted flex" style={{ fontSize: 13 }}><Check size={14} /> Enregistré</span>}
      </div>
    </form>
  );
}
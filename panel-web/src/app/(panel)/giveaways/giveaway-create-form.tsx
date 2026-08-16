'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, Check, Settings2 } from 'lucide-react';

type Channel = { channelId: string; name: string };
type Role = { roleId: string; name: string };

const DURATION_PRESETS = [
  { label: '30 min', minutes: 30 },
  { label: '1 h', minutes: 60 },
  { label: '12 h', minutes: 720 },
  { label: '24 h', minutes: 1440 },
  { label: '3 jours', minutes: 4320 },
  { label: '7 jours', minutes: 10080 },
];

export function GiveawayCreateForm({ channels, roles }: { channels: Channel[]; roles: Role[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    channelId: '',
    title: '',
    prize: '',
    description: '',
    durationMinutes: '60',
    winners: '1',
    requiredRoleId: '',
    bannedRoleIds: [] as string[],
    minSpend: '',
    boostersBonus: '0',
    maxParticipants: '0',
    announceChannelId: '',
    pingRoleId: '',
    dmMessage: '',
    deleteOnEnd: false,
  });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.channelId || !form.title.trim() || !form.prize.trim() || sending) return;
    setSending(true);
    setError('');
    const res = await fetch('/api/giveaways', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSending(false);
    if (res.ok) {
      setForm({
        channelId: '', title: '', prize: '', description: '', durationMinutes: '60', winners: '1',
        requiredRoleId: '', bannedRoleIds: [], minSpend: '', boostersBonus: '0', maxParticipants: '0',
        announceChannelId: '', pingRoleId: '', dmMessage: '', deleteOnEnd: false,
      });
      setDone(true);
      setTimeout(() => setDone(false), 4000);
      setTimeout(() => router.refresh(), 4000);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Erreur lors de la création.');
    }
  }

  function toggleBanned(id: string) {
    setForm((f) => ({
      ...f,
      bannedRoleIds: f.bannedRoleIds.includes(id) ? f.bannedRoleIds.filter((x) => x !== id) : [...f.bannedRoleIds, id],
    }));
  }

  return (
    <form onSubmit={submit}>
      <div className="row">
        <div style={{ flex: 1 }}>
          <label>Salon du giveaway</label>
          <select value={form.channelId} onChange={(e) => set('channelId', e.target.value)}>
            <option value="">— Choisir un salon texte —</option>
            {channels.map((c) => (
              <option key={c.channelId} value={c.channelId}>
                #{c.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label>Titre</label>
          <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Ex : Giveaway de lancement" />
        </div>
      </div>
      <div className="row">
        <div style={{ flex: 1 }}>
          <label>Lot à gagner</label>
          <input value={form.prize} onChange={(e) => set('prize', e.target.value)} placeholder="Ex : Nitro 1 mois" />
        </div>
        <div>
          <label>Gagnants</label>
          <input type="number" min="1" max="20" value={form.winners} onChange={(e) => set('winners', e.target.value)} style={{ maxWidth: 90 }} />
        </div>
      </div>
      <div>
        <label>Durée</label>
        <div className="flex" style={{ gap: 6, flexWrap: 'wrap' }}>
          {DURATION_PRESETS.map((p) => (
            <button
              key={p.minutes}
              type="button"
              className={`btn-secondary btn-small ${Number(form.durationMinutes) === p.minutes ? 'active' : ''}`}
              onClick={() => set('durationMinutes', String(p.minutes))}
            >
              {p.label}
            </button>
          ))}
          <input
            type="number"
            min="1"
            value={form.durationMinutes}
            onChange={(e) => set('durationMinutes', e.target.value)}
            style={{ maxWidth: 110 }}
            title="Durée personnalisée en minutes"
          />
          <span className="muted" style={{ fontSize: 12, alignSelf: 'center' }}>min</span>
        </div>
      </div>
      <div>
        <label>Description (optionnel)</label>
        <input value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Ex : Règles, conditions..." />
      </div>

      <details style={{ marginTop: 14 }}>
        <summary className="muted" style={{ cursor: 'pointer', fontSize: 14 }}>
          <Settings2 size={14} /> Options avancées
        </summary>

        <div className="row" style={{ marginTop: 10 }}>
          <div style={{ flex: 1 }}>
            <label>Rôle requis pour participer</label>
            <select value={form.requiredRoleId} onChange={(e) => set('requiredRoleId', e.target.value)}>
              <option value="">— Aucun —</option>
              {roles.map((r) => (
                <option key={r.roleId} value={r.roleId}>@{r.name}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label>Minimum dépensé (€) pour participer</label>
            <input type="number" min="0" step="0.01" value={form.minSpend} onChange={(e) => set('minSpend', e.target.value)} placeholder="0 = illimité" />
          </div>
        </div>

        <div className="row">
          <div style={{ flex: 1 }}>
            <label>Participations bonus pour les boosters</label>
            <input type="number" min="0" value={form.boostersBonus} onChange={(e) => set('boostersBonus', e.target.value)} placeholder="ex : 2" />
          </div>
          <div style={{ flex: 1 }}>
            <label>Participants maximum</label>
            <input type="number" min="0" value={form.maxParticipants} onChange={(e) => set('maxParticipants', e.target.value)} placeholder="0 = illimité" />
          </div>
        </div>

        <div>
          <label>Rôles exclus (ne peuvent pas participer)</label>
          <div style={{ maxHeight: 140, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
            {roles.length === 0 && <p className="muted" style={{ fontSize: 12 }}>Aucun rôle trouvé.</p>}
            {roles.map((r) => (
              <label key={r.roleId} className="checkbox" style={{ display: 'inline-flex', width: '45%', margin: '2px 4px' }}>
                <input
                  type="checkbox"
                  checked={form.bannedRoleIds.includes(r.roleId)}
                  onChange={() => toggleBanned(r.roleId)}
                />
                @{r.name}
              </label>
            ))}
          </div>
        </div>

        <div className="row">
          <div style={{ flex: 1 }}>
            <label>Salon d'annonce des gagnants</label>
            <select value={form.announceChannelId} onChange={(e) => set('announceChannelId', e.target.value)}>
              <option value="">— Même salon que le giveaway —</option>
              {channels.map((c) => (
                <option key={c.channelId} value={c.channelId}>#{c.name}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label>Rôle à mentionner au lancement</label>
            <select value={form.pingRoleId} onChange={(e) => set('pingRoleId', e.target.value)}>
              <option value="">— Aucun —</option>
              {roles.map((r) => (
                <option key={r.roleId} value={r.roleId}>@{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label>Message privé aux gagnants (personnalisé)</label>
          <input value={form.dmMessage} onChange={(e) => set('dmMessage', e.target.value)} placeholder="Laissé vide : message par défaut. Tu peux utiliser {prize} et {title}." />
        </div>

        <label className="checkbox" style={{ marginTop: 8 }}>
          <input type="checkbox" checked={form.deleteOnEnd} onChange={(e) => set('deleteOnEnd', e.target.checked)} />
          Supprimer le message du giveaway quand il est terminé
        </label>
      </details>

      {error && <p style={{ color: 'var(--red)', margin: '8px 0 0', fontSize: 14 }}>{error}</p>}
      <div style={{ marginTop: 12 }}>
        <button type="submit" className="btn-green" disabled={sending || !form.channelId || !form.title.trim() || !form.prize.trim()}>
          {sending ? 'Création...' : <><Gift size={16} /> Lancer le giveaway</>}
        </button>
        {done && <span className="muted flex" style={{ fontSize: 13, marginLeft: 10 }}><Check size={14} /> Giveaway lancé ! Le bot l'affiche dans le salon choisi.</span>}
      </div>
    </form>
  );
}
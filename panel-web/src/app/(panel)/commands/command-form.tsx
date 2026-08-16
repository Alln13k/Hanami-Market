'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Plus, Check } from 'lucide-react';

type Role = { roleId: string; name: string };
type Channel = { channelId: string; name: string };

type FormData = {
  trigger: string;
  roleId: string;
  responseType: string;
  text: string;
  title: string;
  description: string;
  color: string;
  imageUrl: string;
  footer: string;
  reactions: string;
  cooldown: string;
  deleteTrigger: boolean;
  channelId: string;
  usageCount?: number;
};

const EMPTY: FormData = {
  trigger: '',
  roleId: '',
  responseType: 'TEXT',
  text: '',
  title: '',
  description: '',
  color: 'f49ecd',
  imageUrl: '',
  footer: '',
  reactions: '',
  cooldown: '0',
  deleteTrigger: false,
  channelId: '',
};

const TYPE_LABELS: Record<string, string> = {
  TEXT: '📝 Texte',
  EMBED: '🖼️ Embed',
  DM: '✉️ Message privé (à l\'auteur)',
  DM_USER: '📨 Message privé (au membre mentionné)',
  REACT: '🌸 Réactions',
  DELETE: '🗑️ Supprimer le message',
};

export function CommandForm({
  roles,
  channels,
  initial,
  commandId,
  onDone,
}: {
  roles: Role[];
  channels: Channel[];
  initial?: Partial<FormData>;
  commandId?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.trigger.trim() || saving) return;
    setSaving(true);
    setError('');
    const res = await fetch(commandId ? `/api/commands/${commandId}` : '/api/commands', {
      method: commandId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      onDone?.();
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Erreur lors de l\'enregistrement.');
    }
  }

  const isEmbed = form.responseType === 'EMBED';
  const isText = form.responseType === 'TEXT' || form.responseType === 'DM' || form.responseType === 'DM_USER';
  const isReact = form.responseType === 'REACT';

  return (
    <form onSubmit={submit}>
      <div className="row">
        <div>
          <label>Déclencheur</label>
          <input
            value={form.trigger}
            onChange={(e) => set('trigger', e.target.value)}
            placeholder="!legit"
            maxLength={80}
          />
        </div>
        <div>
          <label>Rôle requis (optionnel)</label>
          <select value={form.roleId} onChange={(e) => set('roleId', e.target.value)}>
            <option value="">— Tout le monde —</option>
            {roles.map((r) => (
              <option key={r.roleId} value={r.roleId}>
                @{r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row">
        <div>
          <label>Type de réponse</label>
          <select value={form.responseType} onChange={(e) => set('responseType', e.target.value)}>
            {Object.entries(TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Restreindre à un salon (optionnel)</label>
          <select value={form.channelId} onChange={(e) => set('channelId', e.target.value)}>
            <option value="">— Partout —</option>
            {channels.map((c) => (
              <option key={c.channelId} value={c.channelId}>
                #{c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isEmbed ? (
        <>
          <div className="row">
            <div>
              <label>Titre</label>
              <input value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={256} />
            </div>
            <div>
              <label>Couleur</label>
              <input value={form.color} onChange={(e) => set('color', e.target.value)} placeholder="f49ecd" maxLength={6} />
            </div>
          </div>
          <div>
            <label>Description</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={4} />
          </div>
          <div className="row">
            <div>
              <label>Image (URL, optionnel)</label>
              <input value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label>Footer</label>
              <input value={form.footer} onChange={(e) => set('footer', e.target.value)} />
            </div>
          </div>
        </>
      ) : isReact ? (
        <div>
          <label>Réactions (emojis séparés par des espaces)</label>
          <input
            value={form.reactions}
            onChange={(e) => set('reactions', e.target.value)}
            placeholder="🌸 👍 ❤️"
          />
          <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            Le bot réagit au message du membre avec ces emojis.
          </p>
        </div>
      ) : isText ? (
        <div>
          <label>{form.responseType === 'DM' ? 'Contenu du message privé' : form.responseType === 'DM_USER' ? 'Contenu du message privé envoyé au membre mentionné' : 'Texte de réponse'}</label>
          <textarea value={form.text} onChange={(e) => set('text', e.target.value)} rows={4} />
          <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            Variables : {'{user}'} {'{username}'} {'{displayname}'} {'{server}'} {'{channel}'} {'{args}'} {'{arg1}'} {'{arg2}'}… {'{mention}'}
          </p>
        </div>
      ) : (
        <div>
          <p className="muted" style={{ fontSize: 13 }}>
            🗑️ Le bot supprimera le message contenant le déclencheur (utile pour des commandes silencieuses).
          </p>
        </div>
      )}

      <div className="row">
        <div>
          <label>Cooldown (secondes)</label>
          <input
            type="number"
            min={0}
            value={form.cooldown}
            onChange={(e) => set('cooldown', e.target.value)}
          />
          <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>0 = aucune limite. Délai entre deux utilisations par membre.</p>
        </div>
        <div>
          <label>&nbsp;</label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={form.deleteTrigger}
              onChange={(e) => set('deleteTrigger', e.target.checked)}
            />
            Supprimer le message de déclenchement
          </label>
        </div>
      </div>

      {error && <p style={{ color: 'var(--red)', margin: 0, fontSize: 14 }}>{error}</p>}
      <div>
        <button type="submit" disabled={saving || !form.trigger.trim()}>
          {saving ? 'Enregistrement...' : commandId ? <><Save size={16} /> Enregistrer</> : <><Plus size={16} /> Créer la commande</>}
        </button>
        {form.usageCount !== undefined && (
          <span className="muted" style={{ fontSize: 13, marginLeft: 10 }}>Utilisée {form.usageCount} fois</span>
        )}
        {saved && <span className="muted flex" style={{ fontSize: 13, marginLeft: 10 }}><Check size={14} /> Enregistré</span>}
      </div>
    </form>
  );
}
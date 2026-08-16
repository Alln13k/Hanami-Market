'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Channel = { channelId: string; name: string };

type Field = { name: string; value: string; inline: boolean };

export function CustomEmbedForm({ channels }: { channels: Channel[] }) {
  const router = useRouter();
  const [channelId, setChannelId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('5865F2');
  const [imageUrl, setImageUrl] = useState('');
  const [footer, setFooter] = useState('');
  const [fields, setFields] = useState<Field[]>([]);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  function addField() {
    setFields((f) => [...f, { name: '', value: '', inline: false }]);
  }

  function updateField(i: number, patch: Partial<Field>) {
    setFields((f) => f.map((field, idx) => (idx === i ? { ...field, ...patch } : field)));
  }

  function removeField(i: number) {
    setFields((f) => f.filter((_, idx) => idx !== i));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!channelId || sending) return;
    setSending(true);
    setError('');
    setDone(false);
    const res = await fetch('/api/embeds/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channelId,
        title,
        description,
        color,
        imageUrl,
        footer,
        fields: fields.filter((f) => f.name && f.value),
      }),
    });
    setSending(false);
    if (res.ok) {
      setDone(true);
      setTimeout(() => setDone(false), 3000);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Erreur lors de l\'envoi.');
    }
  }

  const previewColor = `#${color.replace('#', '') || '5865F2'}`;

  return (
    <form onSubmit={submit}>
      <div>
        <label>Salon</label>
        <select value={channelId} onChange={(e) => setChannelId(e.target.value)}>
          <option value="">— Choisir un salon —</option>
          {channels.map((c) => (
            <option key={c.channelId} value={c.channelId}>
              #{c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="row">
        <div>
          <label>Titre</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={256} />
        </div>
        <div>
          <label>Couleur</label>
          <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="5865F2" maxLength={6} />
        </div>
      </div>

      <div>
        <label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
      </div>

      <div className="row">
        <div>
          <label>Image (URL)</label>
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <label>Footer</label>
          <input value={footer} onChange={(e) => setFooter(e.target.value)} />
        </div>
      </div>

      <div>
        <label>Champs (optionnel)</label>
        {fields.map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <input
              style={{ flex: 1 }}
              placeholder="Nom"
              value={f.name}
              onChange={(e) => updateField(i, { name: e.target.value })}
              maxLength={256}
            />
            <input
              style={{ flex: 2 }}
              placeholder="Valeur"
              value={f.value}
              onChange={(e) => updateField(i, { value: e.target.value })}
            />
            <label style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="checkbox"
                checked={f.inline}
                onChange={(e) => updateField(i, { inline: e.target.checked })}
                style={{ width: 'auto' }}
              />
              Inline
            </label>
            <button type="button" className="btn-red btn-small" onClick={() => removeField(i)}>✕</button>
          </div>
        ))}
        <button type="button" className="btn-secondary btn-small" onClick={addField}>+ Ajouter un champ</button>
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 14, background: 'var(--panel-2)' }}>
        <div style={{ borderLeft: `4px solid ${previewColor}`, paddingLeft: 10 }}>
          {title && <div style={{ fontWeight: 800, fontSize: 16 }}>{title}</div>}
          {description && <div style={{ marginTop: 4, fontSize: 14, whiteSpace: 'pre-wrap' }}>{description}</div>}
          {fields.some((f) => f.name && f.value) && (
            <div style={{ marginTop: 8, fontSize: 13 }}>
              {fields.filter((f) => f.name && f.value).map((f, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  <strong>{f.name}</strong> — {f.value}
                </div>
              ))}
            </div>
          )}
          {footer && <div className="muted" style={{ marginTop: 8, fontSize: 11 }}>{footer}</div>}
        </div>
      </div>

      {error && <p style={{ color: 'var(--red)', margin: 0, fontSize: 14 }}>{error}</p>}
      <div>
        <button type="submit" disabled={sending || !channelId}>
          {sending ? 'Envoi...' : '📨 Envoyer'}
        </button>
        {done && <span className="muted" style={{ fontSize: 13, marginLeft: 10 }}>✅ Envoyé</span>}
      </div>
    </form>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Plus, Check } from 'lucide-react';

type Role = { roleId: string; name: string };

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
};

export function CommandForm({
  roles,
  initial,
  commandId,
  onDone,
}: {
  roles: Role[];
  initial?: Partial<FormData>;
  commandId?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof FormData>(key: K, value: string) {
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
      onDone?.();
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Erreur lors de l\'enregistrement.');
    }
  }

  const isEmbed = form.responseType === 'EMBED';

  return (
    <form onSubmit={submit}>
      <div className="row">
        <div>
          <label>Déclencheur</label>
          <input
            value={form.trigger}
            onChange={(e) => set('trigger', e.target.value)}
            placeholder="+legit"
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

      <div>
        <label>Type de réponse</label>
        <select value={form.responseType} onChange={(e) => set('responseType', e.target.value)}>
          <option value="TEXT">Texte</option>
          <option value="EMBED">Embed</option>
        </select>
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
      ) : (
        <div>
          <label>Texte de réponse</label>
          <textarea value={form.text} onChange={(e) => set('text', e.target.value)} rows={4} />
        </div>
      )}

      {error && <p style={{ color: 'var(--red)', margin: 0, fontSize: 14 }}>{error}</p>}
      <div>
        <button type="submit" disabled={saving || !form.trigger.trim()}>
          {saving ? 'Enregistrement...' : commandId ? <><Save size={16} /> Enregistrer</> : <><Plus size={16} /> Créer la commande</>}
        </button>
      </div>
    </form>
  );
}
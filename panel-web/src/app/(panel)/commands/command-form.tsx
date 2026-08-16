'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Plus, Check, ArrowUp, ArrowDown, X } from 'lucide-react';

type Role = { roleId: string; name: string };
type Channel = { channelId: string; name: string };

type Step = {
  type: string;
  text: string;
  title: string;
  description: string;
  color: string;
  imageUrl: string;
  footer: string;
  reactions: string;
  wait: string;
};

type FormData = {
  trigger: string;
  roleId: string;
  channelId: string;
  cooldown: string;
  deleteTrigger: boolean;
  steps: Step[];
  usageCount?: number;
};

const STEP_LABELS: Record<string, string> = {
  TEXT: '📝 Répondre (texte)',
  EMBED: '🖼️ Répondre (embed)',
  DM: '✉️ Message privé à l\'auteur',
  DM_USER: '📨 Message privé au membre mentionné',
  REACT: '🌸 Réactions',
  DELETE: '🗑️ Supprimer le message',
  WAIT: '⏳ Attendre (ms)',
};

const EMPTY_STEP: Step = {
  type: 'TEXT',
  text: '',
  title: '',
  description: '',
  color: 'f49ecd',
  imageUrl: '',
  footer: '',
  reactions: '',
  wait: '1000',
};

type Legacy = {
  responseType?: string;
  text?: string;
  title?: string;
  description?: string;
  color?: string;
  imageUrl?: string;
  footer?: string;
  reactions?: string;
  steps?: Step[];
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
  initial?: Partial<FormData> & Legacy;
  commandId?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(() => {
    const steps: Step[] =
      Array.isArray(initial?.steps) && initial.steps!.length > 0
        ? initial.steps!.map((s) => ({ ...EMPTY_STEP, ...s }))
        : [
            {
              ...EMPTY_STEP,
              type: initial?.responseType || 'TEXT',
              text: initial?.text || '',
              title: initial?.title || '',
              description: initial?.description || '',
              color: initial?.color || 'f49ecd',
              imageUrl: initial?.imageUrl || '',
              footer: initial?.footer || '',
              reactions: initial?.reactions || '',
            },
          ];
    return {
      trigger: initial?.trigger || '',
      roleId: initial?.roleId || '',
      channelId: initial?.channelId || '',
      cooldown: initial?.cooldown || '0',
      deleteTrigger: initial?.deleteTrigger || false,
      steps,
      usageCount: initial?.usageCount,
    };
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  function setStep(i: number, patch: Partial<Step>) {
    setForm((f) => ({
      ...f,
      steps: f.steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    }));
  }

  function addStep() {
    setForm((f) => ({ ...f, steps: [...f.steps, { ...EMPTY_STEP }] }));
  }

  function removeStep(i: number) {
    setForm((f) => ({ ...f, steps: f.steps.filter((_, idx) => idx !== i) }));
  }

  function moveStep(i: number, dir: -1 | 1) {
    setForm((f) => {
      const steps = [...f.steps];
      const j = i + dir;
      if (j < 0 || j >= steps.length) return f;
      [steps[i], steps[j]] = [steps[j], steps[i]];
      return { ...f, steps };
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.trigger.trim() || saving) return;
    setSaving(true);
    setError('');
    const body = {
      trigger: form.trigger,
      roleId: form.roleId,
      channelId: form.channelId,
      cooldown: form.cooldown,
      deleteTrigger: form.deleteTrigger,
      steps: form.steps,
    };
    const res = await fetch(commandId ? `/api/commands/${commandId}` : '/api/commands', {
      method: commandId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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

  return (
    <form onSubmit={submit}>
      <div className="row">
        <div>
          <label>Déclencheur</label>
          <input
            value={form.trigger}
            onChange={(e) => setForm((f) => ({ ...f, trigger: e.target.value }))}
            placeholder="!legit"
            maxLength={80}
          />
        </div>
        <div>
          <label>Rôle requis (optionnel)</label>
          <select value={form.roleId} onChange={(e) => setForm((f) => ({ ...f, roleId: e.target.value }))}>
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
          <label>Restreindre à un salon (optionnel)</label>
          <select value={form.channelId} onChange={(e) => setForm((f) => ({ ...f, channelId: e.target.value }))}>
            <option value="">— Partout —</option>
            {channels.map((c) => (
              <option key={c.channelId} value={c.channelId}>
                #{c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Cooldown (secondes)</label>
          <input
            type="number"
            min={0}
            value={form.cooldown}
            onChange={(e) => setForm((f) => ({ ...f, cooldown: e.target.value }))}
          />
          <p className="muted" style={{ fontSize: 12, marginTop: 4 }}>0 = aucune limite.</p>
        </div>
      </div>

      <div>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={form.deleteTrigger}
            onChange={(e) => setForm((f) => ({ ...f, deleteTrigger: e.target.checked }))}
          />
          Supprimer le message de déclenchement
        </label>
      </div>

      <div>
        <label style={{ fontSize: 15, color: 'var(--text)' }}>Actions (exécutées dans l'ordre)</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {form.steps.map((step, i) => (
            <div
              key={i}
              style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 14, background: 'var(--panel-2)' }}
            >
              <div className="flex justify-between" style={{ marginBottom: 10 }}>
                <span className="flex">
                  <span className="badge OPEN">#{i + 1}</span>
                  <select
                    value={step.type}
                    onChange={(e) => setStep(i, { type: e.target.value })}
                    style={{ maxWidth: 280 }}
                  >
                    {Object.entries(STEP_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </span>
                <span className="flex">
                  <button type="button" className="btn-secondary btn-small" onClick={() => moveStep(i, -1)} disabled={i === 0} title="Monter">
                    <ArrowUp size={14} />
                  </button>
                  <button type="button" className="btn-secondary btn-small" onClick={() => moveStep(i, 1)} disabled={i === form.steps.length - 1} title="Descendre">
                    <ArrowDown size={14} />
                  </button>
                  <button type="button" className="btn-red btn-small" onClick={() => removeStep(i)} title="Retirer cette action">
                    <X size={14} />
                  </button>
                </span>
              </div>

              {step.type === 'EMBED' && (
                <>
                  <div className="row">
                    <div>
                      <label>Titre</label>
                      <input value={step.title} onChange={(e) => setStep(i, { title: e.target.value })} maxLength={256} />
                    </div>
                    <div>
                      <label>Couleur</label>
                      <input value={step.color} onChange={(e) => setStep(i, { color: e.target.value })} placeholder="f49ecd" maxLength={6} />
                    </div>
                  </div>
                  <div>
                    <label>Description</label>
                    <textarea value={step.description} onChange={(e) => setStep(i, { description: e.target.value })} rows={3} />
                  </div>
                  <div className="row">
                    <div>
                      <label>Image (URL, optionnel)</label>
                      <input value={step.imageUrl} onChange={(e) => setStep(i, { imageUrl: e.target.value })} placeholder="https://..." />
                    </div>
                    <div>
                      <label>Footer</label>
                      <input value={step.footer} onChange={(e) => setStep(i, { footer: e.target.value })} />
                    </div>
                  </div>
                </>
              )}

              {['TEXT', 'DM', 'DM_USER'].includes(step.type) && (
                <div>
                  <label>
                    {step.type === 'DM' ? 'Contenu du message privé' : step.type === 'DM_USER' ? 'Contenu du message privé au membre mentionné' : 'Texte de réponse'}
                  </label>
                  <textarea value={step.text} onChange={(e) => setStep(i, { text: e.target.value })} rows={3} />
                </div>
              )}

              {step.type === 'REACT' && (
                <div>
                  <label>Réactions (emojis séparés par des espaces)</label>
                  <input value={step.reactions} onChange={(e) => setStep(i, { reactions: e.target.value })} placeholder="🌸 👍 ❤️" />
                </div>
              )}

              {step.type === 'WAIT' && (
                <div>
                  <label>Durée d'attente (millisecondes)</label>
                  <input type="number" min={0} max={60000} value={step.wait} onChange={(e) => setStep(i, { wait: e.target.value })} />
                </div>
              )}

              {step.type === 'DELETE' && (
                <p className="muted" style={{ margin: 0, fontSize: 13 }}>🗑️ Le message contenant le déclencheur sera supprimé à cette étape.</p>
              )}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10 }}>
          <button type="button" className="btn-secondary" onClick={addStep}>
            <Plus size={16} /> Ajouter une action
          </button>
        </div>
      </div>

      <p className="muted" style={{ fontSize: 12, margin: 0 }}>
        Variables disponibles dans les textes et embeds : {'{user}'} {'{username}'} {'{displayname}'} {'{server}'} {'{channel}'} {'{args}'} {'{arg1}'} {'{arg2}'}… {'{mention}'}
      </p>

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
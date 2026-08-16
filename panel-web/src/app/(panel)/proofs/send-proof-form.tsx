'use client';

import { useRef, useState } from 'react';
import { Upload, Check } from 'lucide-react';

export function SendProofForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setResult('');
    setError('');
    if (f) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview('');
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || sending) return;
    setSending(true);
    setError('');
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/proofs/send', { method: 'POST', body: form });
    setSending(false);
    if (res.ok) {
      const data = await res.json();
      setResult(`PROOF #${data.number}`);
      setFile(null);
      setPreview('');
      if (inputRef.current) inputRef.current.value = '';
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Erreur lors de l\'envoi.');
    }
  }

  return (
    <form onSubmit={submit}>
      {preview && (
        <img
          src={preview}
          alt="Aperçu"
          style={{ maxWidth: 320, maxHeight: 200, borderRadius: 10, border: '1px solid var(--border)' }}
        />
      )}
      <div>
        <input ref={inputRef} type="file" accept="image/*" onChange={onSelect} />
      </div>
      {error && <p style={{ color: 'var(--red)', margin: 0, fontSize: 14 }}>{error}</p>}
      <div>
        <button type="submit" disabled={sending || !file}>
          {sending ? 'Envoi en cours...' : <><Upload size={16} /> Importer l'image et envoyer</>}
        </button>
        {result && <span className="muted flex" style={{ fontSize: 14, marginLeft: 10, fontWeight: 700 }}><Check size={16} /> {result} envoyée !</span>}
      </div>
    </form>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setError('Mot de passe incorrect.');
      setLoading(false);
    }
  }

  return (
    <main className="login-screen">
      <div className="login-box">
        <img className="login-logo" src="https://i.imgur.com/s2BQbyJ.jpeg" alt="Logo Hanami" />
        <h1 className="logo-text" style={{ marginTop: 0 }}>Hanami Market</h1>
        <p className="muted" style={{ marginTop: -8 }}>🌸 Connexion à l'administration</p>
        <form onSubmit={onSubmit}>
          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoFocus
          />
          {error && <p style={{ color: 'var(--red)', margin: 0, fontSize: 14 }}>{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </main>
  );
}
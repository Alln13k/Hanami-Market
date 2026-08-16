'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV = [
  { href: '/dashboard', label: '📊 Tableau de bord' },
  { href: '/products', label: '📦 Produits' },
  { href: '/tickets', label: '🎫 Tickets' },
  { href: '/transcripts', label: '📼 Transcriptions' },
  { href: '/embeds', label: '📨 Embeds' },
  { href: '/commands', label: '⌨️ Commandes' },
  { href: '/settings', label: '⚙️ Réglages' },
];

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <div className="panel-layout">
      <aside className="sidebar">
        <div className="logo">
          <img className="logo-img" src="https://i.imgur.com/s2BQbyJ.jpeg" alt="Logo Hanami" />
          <span className="logo-text">Hanami Market</span>
        </div>
        <nav>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname.startsWith(item.href) ? 'active' : ''}
            >
              {item.label}
            </Link>
          ))}
          <a href="#" onClick={(e) => { e.preventDefault(); logout(); }} style={{ marginTop: 20 }}>
            🚪 Déconnexion
          </a>
        </nav>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
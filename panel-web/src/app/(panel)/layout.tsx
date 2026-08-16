'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Ticket,
  History,
  MessageSquare,
  Command,
  Settings,
  LogOut,
  Trophy,
  Camera,
  BadgeCheck,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/products', label: 'Produits', icon: Package },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/proofs', label: 'Preuves', icon: Camera },
  { href: '/vouch', label: 'Vouch', icon: BadgeCheck },
  { href: '/tickets', label: 'Tickets', icon: Ticket },
  { href: '/transcripts', label: 'Transcriptions', icon: History },
  { href: '/embeds', label: 'Embeds', icon: MessageSquare },
  { href: '/commands', label: 'Commandes', icon: Command },
  { href: '/settings', label: 'Réglages', icon: Settings },
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
              <item.icon size={16} className="nav-icon" />
              {item.label}
            </Link>
          ))}
          <a href="#" onClick={(e) => { e.preventDefault(); logout(); }} style={{ marginTop: 20 }}>
            <LogOut size={16} className="nav-icon" />
            Déconnexion
          </a>
        </nav>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
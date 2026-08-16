import type { Metadata } from 'next';
import './globals.css';
import SakuraPetals from '@/components/sakura';

export const metadata: Metadata = {
  title: 'Hanami Market — Administration',
  description: 'Panel d\'administration du shop Discord',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <SakuraPetals />
        {children}
      </body>
    </html>
  );
}
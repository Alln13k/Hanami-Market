import { prisma } from '@/lib/prisma';
import { SettingsForm } from './settings-form';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const keys = ['guildId', 'ticketCategoryId', 'adminChannelId', 'adminRoleId', 'panelUrl'];
  const settings = await prisma.setting.findMany({ where: { key: { in: keys } } });
  const obj: Record<string, string> = {};
  for (const s of settings) obj[s.key] = s.value;

  return (
    <>
      <h1 className="page-title">Réglages</h1>
      <p className="page-sub">Configurations synchronisées entre le bot et le panel</p>

      <div className="card" style={{ maxWidth: 640 }}>
        <SettingsForm initial={obj} />
      </div>

      <div className="card" style={{ maxWidth: 640, marginTop: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 16 }}>Rappel d'installation</h2>
        <ol className="muted" style={{ lineHeight: 1.8, fontSize: 14 }}>
          <li>Lance <code>npm run deploy</code> côté bot pour déployer les commandes slash.</li>
          <li>Dans Discord, tape <code>/setup</code> dans le salon admin (créera la catégorie Tickets).</li>
          <li>Tape <code>/ticket</code> dans le salon public pour poser le bouton &quot;Ouvrir un ticket&quot;.</li>
          <li>Le bouton livraison s&apos;exécute automatiquement quand le paiement est confirmé.</li>
        </ol>
      </div>
    </>
  );
}
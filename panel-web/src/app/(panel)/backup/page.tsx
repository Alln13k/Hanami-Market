import { prisma } from '@/lib/prisma';
import { DatabaseBackup } from 'lucide-react';
import { BackupControls } from './backup-controls';

export const dynamic = 'force-dynamic';

export default async function BackupPage() {
  const [vouchCount, proofCount, ticketCount, productCount] = await Promise.all([
    prisma.vouch.count(),
    prisma.proof.count(),
    prisma.ticket.count(),
    prisma.product.count(),
  ]);
  const lastBackup = await prisma.setting.findUnique({ where: { key: 'lastBackupAt' } });

  return (
    <>
      <h1 className="page-title">Sauvegarde</h1>
      <p className="page-sub">
        Exporte toutes les données (vouches, preuves, rôles, salons, stats des membres, produits, tickets...) en un seul
        fichier JSON. Tu peux ensuite le restaurer depuis n'importe quel panel — parfait si tu dois inviter le bot sur un
        nouveau serveur.
      </p>

      <div className="card" style={{ maxWidth: 720 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><DatabaseBackup size={16} /> Sauvegarde et restauration</h2>
        <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
          Contenu : {vouchCount} vouches · {proofCount} preuves · {productCount} produits · {ticketCount} tickets ouverts ·
          {lastBackup ? ` · dernière sauvegarde : ${new Date(lastBackup.value).toLocaleString('fr-FR')}` : ''}
        </p>
        <BackupControls />
      </div>

      <div className="card" style={{ maxWidth: 720, marginTop: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>Restaurer sur un nouveau serveur</h2>
        <ol className="muted" style={{ lineHeight: 1.8, fontSize: 14 }}>
          <li>Invite le bot sur le nouveau serveur (même instance bot/panel, même base de données).</li>
          <li>Dans Discord, lance <code>/setup</code> puis laisse le bot synchroniser salons, rôles et membres.</li>
          <li>Dans le panel, onglet <strong>Sauvegarde</strong> : importe ton fichier JSON pour retrouver produits, vouches,
            preuves, leaderboard, invitations et transcriptions.</li>
        </ol>
      </div>
    </>
  );
}
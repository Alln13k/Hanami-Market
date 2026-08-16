import { prisma } from '@/lib/prisma';
import { DatabaseBackup } from 'lucide-react';
import { BackupControls } from './backup-controls';

export const dynamic = 'force-dynamic';

export default async function BackupPage() {
  const [backups, guildsSetting, vouchCount, proofCount, productCount] = await Promise.all([
    prisma.backup.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.setting.findUnique({ where: { key: 'botGuilds' } }),
    prisma.vouch.count(),
    prisma.proof.count(),
    prisma.product.count(),
  ]);

  let guilds: { id: string; name: string; memberCount?: number }[] = [];
  try {
    guilds = guildsSetting?.value ? JSON.parse(guildsSetting.value) : [];
  } catch {
    guilds = [];
  }

  return (
    <>
      <h1 className="page-title">Sauvegarde</h1>
      <p className="page-sub">
        Sauvegarde complète du serveur (salons, rôles, membres, stats leaderboard par personne, produits, vouches, preuves,
        tickets...) stockée dans le dossier <code>BACKUP</code> sur l'hébergeur du bot. Tu peux restaurer n'importe quelle
        sauvegarde sur le serveur Discord de ton choix — le bot recrée rôles et salons automatiquement.
      </p>

      <div className="card" style={{ maxWidth: 900 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><DatabaseBackup size={16} /> Gestion des sauvegardes</h2>
        <p className="muted" style={{ fontSize: 13, marginTop: 4 }}>
          Données actuelles : {vouchCount} vouches · {proofCount} preuves · {productCount} produits ·
          {guilds.length > 0 ? ` · bot sur ${guilds.length} serveur(s) : ${guilds.map((g) => g.name).join(', ')}` : ' · le bot n\'est connecté à aucun serveur (encore)'}
        </p>
        <BackupControls guilds={guilds} backups={backups} />
      </div>

      <div className="card" style={{ maxWidth: 900, marginTop: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>Comment restaurer sur un nouveau serveur</h2>
        <ol className="muted" style={{ lineHeight: 1.8, fontSize: 14 }}>
          <li>Invite le bot sur le nouveau serveur Discord (même instance bot/panel).</li>
          <li>Dans le tableau ci-dessus, choisis la sauvegarde puis le <strong>serveur cible</strong> et clique « Restaurer ».</li>
          <li>Le bot importe toutes les données, <strong>recrée les rôles et les salons</strong> (mêmes noms, catégories, positions et couleurs) et remappe tous les réglages.</li>
          <li>Ensuite dans Discord, lance <code>/setup</code> pour la catégorie Tickets, puis republie les embeds (produits, leaderboard, vouch, preuves, bienvenue) depuis le panel.</li>
        </ol>
      </div>
    </>
  );
}
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { CommandForm } from './command-form';
import { DeleteCommandButton } from './delete-button';

export const dynamic = 'force-dynamic';

const TYPE_BADGES: Record<string, string> = {
  TEXT: 'TEXT',
  EMBED: 'EMBED',
  DM: 'DM',
  DM_USER: 'DM USER',
  REACT: 'REACT',
  DELETE: 'DELETE',
};

export default async function CommandsPage() {
  const [commands, roles, channels] = await Promise.all([
    prisma.customCommand.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.role.findMany({ orderBy: { position: 'desc' } }),
    prisma.guildChannel.findMany({ where: { isText: true }, orderBy: { position: 'asc' }, take: 200 }),
  ]);

  const roleName = (id: string | null) => {
    if (!id) return 'Tout le monde';
    return `@${roles.find((r) => r.roleId === id)?.name || id}`;
  };

  const channelName = (id: string | null) => {
    if (!id) return 'Partout';
    return `#${channels.find((c) => c.channelId === id)?.name || id}`;
  };

  return (
    <>
      <h1 className="page-title">Commandes personnalisées</h1>
      <p className="page-sub">
        Quand un membre (avec le rôle requis) écrit le déclencheur : texte, embed, message privé, réactions ou
        suppression du message.
      </p>

      <div className="card" style={{ maxWidth: 760, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><Plus size={16} /> Nouvelle commande</h2>
        <CommandForm roles={roles} channels={channels} />
      </div>

      <div className="card" style={{ maxWidth: 760 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>Commandes existantes</h2>
        {commands.length === 0 ? (
          <p className="muted">Aucune commande pour le moment.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Déclencheur</th>
                <th>Réponse</th>
                <th>Rôle</th>
                <th>Salon</th>
                <th>Utilisations</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {commands.map((c) => (
                <tr key={c.id}>
                  <td><code>{c.trigger}</code></td>
                  <td><span className={`badge ${c.responseType === 'EMBED' ? 'PENDING' : 'OPEN'}`}>{TYPE_BADGES[c.responseType] || c.responseType}</span></td>
                  <td>{roleName(c.roleId)}</td>
                  <td className="muted">{channelName(c.channelId)}</td>
                  <td><strong>{c.usageCount}</strong></td>
                  <td className="flex">
                    <Link href={`/commands/${c.id}`} className="btn btn-secondary btn-small">Modifier</Link>
                    <DeleteCommandButton id={c.id} trigger={c.trigger} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
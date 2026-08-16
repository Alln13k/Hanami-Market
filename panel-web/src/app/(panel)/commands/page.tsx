import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { CommandForm } from './command-form';
import { DeleteCommandButton } from './delete-button';

export const dynamic = 'force-dynamic';

export default async function CommandsPage() {
  const [commands, roles] = await Promise.all([
    prisma.customCommand.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.role.findMany({ orderBy: { position: 'desc' } }),
  ]);

  const roleName = (id: string | null) => {
    if (!id) return 'Tout le monde';
    return `@${roles.find((r) => r.roleId === id)?.name || id}`;
  };

  return (
    <>
      <h1 className="page-title">Commandes personnalisées</h1>
      <p className="page-sub">Quand un membre (avec le rôle requis) écrit le déclencheur, le bot répond.</p>

      <div className="card" style={{ maxWidth: 720, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>➕ Nouvelle commande</h2>
        <CommandForm roles={roles} />
      </div>

      <div className="card" style={{ maxWidth: 720 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>Commandes existantes</h2>
        {commands.length === 0 ? (
          <p className="muted">Aucune commande pour le moment.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Déclencheur</th>
                <th>Rôle requis</th>
                <th>Réponse</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {commands.map((c) => (
                <tr key={c.id}>
                  <td><code>{c.trigger}</code></td>
                  <td>{roleName(c.roleId)}</td>
                  <td>{c.responseType === 'EMBED' ? `📇 Embed — ${c.title || 'sans titre'}` : `💬 ${c.text || ''}`}</td>
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
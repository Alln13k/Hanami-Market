import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ShieldCheck, UserCog } from 'lucide-react';
import { AutoRolesForm } from './auto-roles-form';
import { permissionsSummary } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export default async function RolesPage() {
  const [roles, members, setting] = await Promise.all([
    prisma.role.findMany({ orderBy: [{ position: 'desc' }] }),
    prisma.member.findMany({ select: { roles: true } }),
    prisma.setting.findUnique({ where: { key: 'autoRoleIds' } }),
  ]);

  // Compte le nombre de membres possédant chaque rôle
  const countByRole = new Map<string, number>();
  for (const m of members) {
    let ids: string[] = [];
    try {
      ids = JSON.parse(m.roles || '[]');
    } catch {}
    for (const id of ids) countByRole.set(id, (countByRole.get(id) || 0) + 1);
  }

  let currentAutoRoles: string[] = [];
  try {
    currentAutoRoles = setting?.value ? JSON.parse(setting.value) : [];
  } catch {}

  return (
    <>
      <h1 className="page-title">Rôles</h1>
      <p className="page-sub">Gère les permissions, attribue / retire des rôles et configure les rôles à l'arrivée.</p>

      <div className="card" style={{ maxWidth: 720, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><UserCog size={16} /> Rôles à l'arrivée (auto-rôles)</h2>
        <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
          Les nouveaux membres reçoivent automatiquement ces rôles en rejoignant le serveur.
        </p>
        <AutoRolesForm roles={roles.map((r) => ({ roleId: r.roleId, name: r.name, color: r.color }))} current={currentAutoRoles} />
      </div>

      <div className="card" style={{ maxWidth: 720 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><ShieldCheck size={16} /> Rôles du serveur</h2>
        {roles.length === 0 ? (
          <p className="muted">Aucun rôle synchronisé. Le bot synchronise automatiquement.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Rôle</th>
                <th>Permissions</th>
                <th>Membres</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.roleId}>
                  <td>
                    <span className="role-color-dot" style={{ background: r.color === '000000' || !r.color ? '#99aab5' : `#${r.color}` }} />
                    {r.name}
                  </td>
                  <td className="muted">{permissionsSummary(r.permissions)}</td>
                  <td><strong>{countByRole.get(r.roleId) || 0}</strong></td>
                  <td className="flex">
                    <Link href={`/roles/${r.roleId}`} className="btn btn-secondary btn-small">Gérer</Link>
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
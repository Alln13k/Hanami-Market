import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ShieldCheck, UserPlus, Users } from 'lucide-react';
import { PermissionForm } from './permission-form';
import { AssignRoleForm } from './assign-form';
import { RemoveRoleButton } from './remove-role-button';

export const dynamic = 'force-dynamic';

export default async function RoleDetailPage({ params }: { params: { roleId: string } }) {
  const role = await prisma.role.findUnique({ where: { roleId: params.roleId } });
  if (!role) {
    return (
      <>
        <h1 className="page-title">Rôle introuvable</h1>
        <Link href="/roles" className="btn btn-secondary">← Retour aux rôles</Link>
      </>
    );
  }

  const [members] = await Promise.all([
    prisma.member.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const holders = members.filter((m) => {
    try {
      return (JSON.parse(m.roles || '[]') as string[]).includes(role.roleId);
    } catch {
      return false;
    }
  });

  const membersWithout = members.filter((m) => !holders.some((h) => h.userId === m.userId));

  const bits = BigInt(role.permissions || '0');

  return (
    <>
      <h1 className="page-title">
        <span className="role-color-dot" style={{ background: role.color === '000000' || !role.color ? '#99aab5' : `#${role.color}` }} />
        {role.name}
      </h1>
      <Link href="/roles" className="btn btn-secondary btn-small" style={{ marginBottom: 20, display: 'inline-flex' }}>← Retour aux rôles</Link>

      <div className="card" style={{ maxWidth: 720, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><ShieldCheck size={16} /> Permissions du rôle</h2>
        <PermissionForm roleId={role.roleId} bits={bits} />
      </div>

      <div className="card" style={{ maxWidth: 720, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><UserPlus size={16} /> Attribuer à un membre</h2>
        <AssignRoleForm roleId={role.roleId} members={membersWithout} roleName={role.name} />
      </div>

      <div className="card" style={{ maxWidth: 720 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><Users size={16} /> Membres avec ce rôle ({holders.length})</h2>
        {holders.length === 0 ? (
          <p className="muted">Aucun membre n'a ce rôle pour le moment.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Membre</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {holders.map((m) => (
                <tr key={m.userId}>
                  <td className="flex">
                    {m.avatarUrl && <img src={m.avatarUrl} alt="" style={{ width: 22, height: 22, borderRadius: '50%', marginRight: 8 }} />}
                    {m.name}
                  </td>
                  <td className="flex">
                    <RemoveRoleButton roleId={role.roleId} userId={m.userId} name={m.name} />
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
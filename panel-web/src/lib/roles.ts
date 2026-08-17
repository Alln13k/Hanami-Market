import { prisma } from './prisma';

// Demande au bot de modifier les permissions d'un rôle
export async function enqueueRolePermissions(roleId: string, permissions: number) {
  await prisma.botAction.create({
    data: { type: 'SET_ROLE_PERMISSIONS', payload: JSON.stringify({ roleId, permissions }) },
  });
}

// Demande au bot d'attribuer un rôle à un membre
export async function enqueueAssignRole(userId: string, roleId: string) {
  await prisma.botAction.create({
    data: { type: 'ASSIGN_ROLE', payload: JSON.stringify({ userId, roleId }) },
  });
}

// Demande au bot de retirer un rôle à un membre
export async function enqueueRemoveRole(userId: string, roleId: string) {
  await prisma.botAction.create({
    data: { type: 'REMOVE_ROLE', payload: JSON.stringify({ userId, roleId }) },
  });
}
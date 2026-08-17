export type PermissionDef = { bit: number; label: string };

// Permissions Discord courantes (valeur du bitfield)
export const PERMISSIONS: PermissionDef[] = [
  { bit: 8, label: 'Administrateur' },
  { bit: 32, label: 'Gérer le serveur' },
  { bit: 128, label: 'Voir les logs du serveur' },
  { bit: 0x1, label: 'Créer des invitations' },
  { bit: 2, label: 'Expulser des membres' },
  { bit: 4, label: 'Bannir des membres' },
  { bit: 0x400, label: 'Voir les salons' },
  { bit: 0x800, label: 'Envoyer des messages' },
  { bit: 0x2000, label: 'Gérer les messages' },
  { bit: 0x4000, label: 'Intégrer des liens' },
  { bit: 0x8000, label: 'Joindre des fichiers' },
  { bit: 0x20000, label: 'Mentionner @everyone / @here / tous les rôles' },
  { bit: 0x100000, label: 'Ajouter des réactions' },
  { bit: 0x200000, label: 'Couper le micro (vocal)' },
  { bit: 0x400000, label: 'Rendre sourd (vocal)' },
  { bit: 0x1000000, label: 'Déplacer les membres (vocal)' },
  { bit: 0x200000, label: 'Mute vocal (rétro-compat)' },
  { bit: 0x4000000, label: 'Gérer les pseudos' },
  { bit: 0x8000000, label: 'Gérer les emojis et autocollants' },
  { bit: 0x10000000, label: 'Gérer les rôles' },
  { bit: 0x20000000, label: 'Gérer les webhooks' },
  { bit: 0x100000000000, label: 'Utiliser les commandes slash' },
  { bit: 0x40000000000, label: 'Créer des threads' },
  { bit: 0x80000000000, label: 'Gérer les threads' },
  { bit: 0x20000000000, label: 'Parler dans les threads publics' },
  { bit: 0x8000000000, label: 'Déplacer les membres (rétro)' },
  { bit: 0x4000000000, label: 'Organiser les événements' },
];

// Convertit un bitfield en liste de labels activés
export function permissionsSummary(bits: bigint | string | number): string {
  let n: bigint;
  try {
    n = typeof bits === 'bigint' ? bits : BigInt(String(bits || '0'));
  } catch {
    n = 0n;
  }
  if (n & 8n) return 'Administrateur';
  const active = PERMISSIONS.filter((p) => n & BigInt(p.bit)).map((p) => p.label);
  return active.slice(0, 3).join(', ') || 'Aucune permission';
}

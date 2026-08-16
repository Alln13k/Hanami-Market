import { config } from '../config.js';

// Vérifie qu'un membre a le rôle admin (ou gère le serveur)
export function isAdmin(member) {
  if (!member) return false;
  if (member.permissions.has('Administrator')) return true;
  if (config.adminRoleId && member.roles.cache.has(config.adminRoleId)) return true;
  return false;
}

export function requireAdmin(interaction) {
  if (!isAdmin(interaction.member)) {
    interaction.reply({ content: '❌ Tu n\'as pas la permission d\'utiliser cette commande.', ephemeral: true });
    return false;
  }
  return true;
}
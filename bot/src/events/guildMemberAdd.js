import { sendWelcome } from '../services/welcome.js';
import { trackJoin } from '../services/invites.js';

// Quand un membre rejoint le serveur : bienvenue + tracking de l'invitation utilisée
export async function handleGuildMemberAdd(member) {
  await Promise.allSettled([sendWelcome(member), trackJoin(member)]);
}
import { trackLeave } from '../services/invites.js';

// Quand un membre quitte le serveur, on note son départ sur l'invitation d'arrivée
export async function handleGuildMemberRemove(member) {
  await trackLeave(member).catch(() => {});
}
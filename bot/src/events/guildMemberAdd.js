import { sendWelcome } from '../services/welcome.js';

// Quand un membre rejoint le serveur, on lui souhaite la bienvenue
export async function handleGuildMemberAdd(member) {
  await sendWelcome(member).catch(() => {});
}
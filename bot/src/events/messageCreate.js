import { prisma } from '../prisma.js';
import { isAdmin } from '../utils/perms.js';
import { storeTicketMessage } from '../services/tickets.js';
import { handleCustomCommand } from '../services/customCommands.js';

// Stocke les messages envoyés dans un salon de ticket et gère les commandes perso
export async function handleMessage(message) {
  if (message.author.bot) return;
  if (!message.guild) return;
  if (!message.channel?.isTextBased?.()) return;

  const ticket = await prisma.ticket.findUnique({
    where: { channelId: message.channel.id },
    select: { id: true },
  });
  if (ticket) {
    const authorType = isAdmin(message.member) ? 'STAFF' : 'USER';
    await storeTicketMessage(ticket.id, {
      authorId: message.author.id,
      authorName: message.author.username,
      authorType,
      content: message.content,
    }).catch(() => {});
  }

  await handleCustomCommand(message);
}
import { prisma } from '../prisma.js';
import { buildEmbed } from './embeds.js';

function matchesTrigger(content, trigger) {
  const c = content.trim().toLowerCase();
  const t = trigger.trim().toLowerCase();
  if (!t) return false;
  if (!c.startsWith(t)) return false;
  const rest = c.slice(t.length);
  return rest === '' || rest.startsWith(' ');
}

// Répond aux commandes personnalisées (déclencheur + rôle requis + texte/embed)
export async function handleCustomCommand(message) {
  if (message.author.bot) return;
  if (!message.guild) return;
  if (!message.channel?.isTextBased?.()) return;

  const commands = await prisma.customCommand.findMany().catch(() => []);
  if (commands.length === 0) return;

  for (const cmd of commands) {
    if (!matchesTrigger(message.content, cmd.trigger)) continue;

    // Vérifie le rôle requis (vide = tout le monde)
    if (cmd.roleId && !message.member?.roles?.cache?.has(cmd.roleId)) continue;

    try {
      if (cmd.responseType === 'EMBED') {
        await message.channel.send({
          embeds: [
            buildEmbed({
              title: cmd.title,
              description: cmd.description,
              color: cmd.color,
              imageUrl: cmd.imageUrl,
              footer: cmd.footer,
              timestamp: true,
            }),
          ],
        });
      } else {
        await message.channel.send({ content: cmd.text || cmd.trigger });
      }
    } catch {
      /* erreur d'envoi : ignore */
    }
    break;
  }
}
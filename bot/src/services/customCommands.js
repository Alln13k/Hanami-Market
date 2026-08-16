import { prisma } from '../prisma.js';
import { buildEmbed } from './embeds.js';

// Cooldown par membre : Map<commandeId, Map<userId, timestamp d'expiration>>
const cooldowns = new Map();

function matchesTrigger(content, trigger) {
  const c = content.trim().toLowerCase();
  const t = trigger.trim().toLowerCase();
  if (!t) return false;
  if (!c.startsWith(t)) return false;
  const rest = c.slice(t.length);
  return rest === '' || rest.startsWith(' ');
}

// Extrait les arguments après le déclencheur
function getArgs(content, trigger) {
  const rest = content.slice(trigger.length).trim();
  return rest ? rest.split(/\s+/) : [];
}

// Remplace les variables {user} {username} {displayname} {server} {channel} {args} {arg1} {mention}...
function fillPlaceholders(text, { message, args }) {
  return (text || '')
    .replaceAll('{user}', message.author.toString())
    .replaceAll('{username}', message.author.username)
    .replaceAll('{displayname}', message.member?.displayName || message.author.displayName)
    .replaceAll('{server}', message.guild?.name || '')
    .replaceAll('{channel}', message.channel?.name || '')
    .replaceAll('{args}', args.join(' ') || '')
    .replace(/\{arg(\d+)\}/g, (_, i) => args[Number(i) - 1] || '')
    .replace(/\{mention\}/g, () => message.mentions?.users?.first()?.toString() || '');
}

// Envoie un petit message éphémère qui se supprime tout seul
async function autoDelete(channel, content, ms = 4000) {
  const msg = await channel.send({ content }).catch(() => null);
  if (msg) setTimeout(() => msg.delete().catch(() => {}), ms);
}

async function executeCommand(message, cmd) {
  const args = getArgs(message.content, cmd.trigger);
  const userId = message.author.id;

  // Cooldown par membre
  if (cmd.cooldown > 0) {
    const map = cooldowns.get(cmd.id) || new Map();
    const until = map.get(userId) || 0;
    const now = Date.now();
    if (now < until) {
      const secs = Math.ceil((until - now) / 1000);
      await autoDelete(message.channel, `⏳ Attends **${secs}s** avant de réutiliser cette commande.`, 4000);
      return false;
    }
    map.set(userId, now + cmd.cooldown * 1000);
    cooldowns.set(cmd.id, map);
  }

  // Supprime le message de déclenchement si demandé
  if (cmd.deleteTrigger) {
    await message.delete().catch(() => {});
  }

  switch (cmd.responseType) {
    case 'EMBED': {
      await message.channel.send({
        embeds: [
          buildEmbed({
            title: fillPlaceholders(cmd.title, { message, args }),
            description: fillPlaceholders(cmd.description, { message, args }),
            color: cmd.color,
            imageUrl: cmd.imageUrl,
            footer: fillPlaceholders(cmd.footer, { message, args }),
            timestamp: true,
          }),
        ],
      });
      break;
    }
    case 'DM': {
      const content = fillPlaceholders(cmd.text, { message, args }) || `Commande ${cmd.trigger} exécutée.`;
      try {
        await message.author.send({ content });
      } catch {
        await autoDelete(message.channel, `❌ Je ne peux pas t'envoyer de message privé (messages privés fermés).`, 5000);
      }
      break;
    }
    case 'DM_USER': {
      const target = message.mentions?.users?.first();
      if (!target) {
        await autoDelete(message.channel, `❌ Mentionne une personne pour cette commande : \`${cmd.trigger} @pseudo\``, 5000);
        break;
      }
      const content = fillPlaceholders(cmd.text, { message, args }).replace('{user}', target.toString());
      try {
        await target.send({ content });
        if (cmd.deleteTrigger === false) {
          await autoDelete(message.channel, `✅ Message privé envoyé à **${target.username}**`, 4000);
        }
      } catch {
        await autoDelete(message.channel, `❌ Impossible d'envoyer un message privé à **${target.username}** (DMs fermés).`, 5000);
      }
      break;
    }
    case 'REACT': {
      const emojis = (cmd.reactions || '').split(/\s+/).filter(Boolean);
      for (const emoji of emojis) {
        await message.react(emoji).catch(() => {});
      }
      break;
    }
    case 'DELETE': {
      // Le message est déjà supprimé si deleteTrigger est actif, sinon on le supprime ici
      if (!cmd.deleteTrigger) await message.delete().catch(() => {});
      break;
    }
    default: {
      const content = fillPlaceholders(cmd.text || cmd.trigger, { message, args });
      await message.channel.send({ content });
    }
  }

  return true;
}

// Répond aux commandes personnalisées (déclencheur + rôle requis + toutes les options)
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

    // Restriction à un salon précis (vide = partout)
    if (cmd.channelId && message.channel.id !== cmd.channelId) continue;

    try {
      const executed = await executeCommand(message, cmd);
      if (executed) {
        await prisma.customCommand.update({
          where: { id: cmd.id },
          data: { usageCount: { increment: 1 } },
        }).catch(() => {});
      }
    } catch {
      /* erreur d'envoi : ignore */
    }
    break;
  }
}
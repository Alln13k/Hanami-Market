import { Client, GatewayIntentBits, Events } from 'discord.js';
import { config } from './config.js';
import { prisma, getSetting, setSetting } from './prisma.js';
import { handleInteraction } from './events/interactionCreate.js';
import { handleMessage } from './events/messageCreate.js';
import { startWorker } from './services/actions.js';
import { syncGuild } from './services/channels.js';

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

global.client = client;

client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Bot connecté en tant que ${c.user.tag}`);

  // Enregistre l'ID du serveur dans les réglages si nécessaire
  const guild = c.guilds.cache.first();
  if (guild) {
    if (!(await getSetting('guildId'))) {
      await setSetting('guildId', guild.id);
    }
  }

  await syncGuild().catch(() => {});
  startWorker();
  console.log('🟢 Worker de tickets démarré.');
});

client.on(Events.InteractionCreate, handleInteraction);
client.on(Events.MessageCreate, handleMessage);

client.login(config.token).catch((err) => {
  console.error('❌ Impossible de se connecter :', err.message);
  process.exit(1);
});
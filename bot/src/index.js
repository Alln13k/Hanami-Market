import { Client, GatewayIntentBits, Events, REST, Routes } from 'discord.js';
import { config } from './config.js';
import { prisma, getSetting, setSetting } from './prisma.js';
import { handleInteraction } from './events/interactionCreate.js';
import { handleMessage } from './events/messageCreate.js';
import { handleGuildMemberUpdate } from './events/guildMemberUpdate.js';
import { handleGuildMemberAdd } from './events/guildMemberAdd.js';
import { handleGuildMemberRemove } from './events/guildMemberRemove.js';
import { startWorker } from './services/actions.js';
import { syncGuild, syncChannels } from './services/channels.js';
import { syncInvites } from './services/invites.js';
import { syncBackupsTable, syncBotGuilds } from './services/backup.js';
import { resumeGiveaways } from './services/giveaways.js';
import { commands } from './commands/index.js';

async function deployCommands() {
  try {
    const rest = new REST({ version: '10' }).setToken(config.token);
    const data = commands.map((c) => c.data.toJSON());
    const guildId = await getSetting('guildId');
    const names = commands.map((c) => `/${c.data.name}`).join(', ');
    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(config.clientId, guildId), { body: data });
      console.log(`🆕 Commandes slash déployées sur le serveur ${guildId} : ${names}`);
    } else {
      await rest.put(Routes.applicationCommands(config.clientId), { body: data });
      console.log(`🆕 Commandes slash déployées en GLOBAL (peut mettre ~1h à apparaître) : ${names}`);
    }
  } catch (err) {
    console.error('⚠️ Déploiement des commandes échoué :', err.message);
  }
}

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
  await syncInvites().catch(() => {});
  await syncBackupsTable().catch(() => {});
  await syncBotGuilds().catch(() => {});
  await resumeGiveaways().catch(() => {});
  await deployCommands();
  startWorker();
  console.log('🟢 Worker de tickets démarré.');
});

client.on(Events.InteractionCreate, handleInteraction);
client.on(Events.MessageCreate, handleMessage);
client.on(Events.GuildMemberUpdate, handleGuildMemberUpdate);
client.on(Events.GuildMemberAdd, handleGuildMemberAdd);
client.on(Events.GuildMemberRemove, handleGuildMemberRemove);
client.on(Events.GuildCreate, () => syncBotGuilds().catch(() => {}));
client.on(Events.GuildDelete, () => syncBotGuilds().catch(() => {}));

// Synchronisation en temps réel des salons et rôles (sans attendre le refresh périodique)
let channelsTimer = null;
function debounceSyncChannels() {
  clearTimeout(channelsTimer);
  channelsTimer = setTimeout(() => syncChannels().catch(() => {}), 300);
}
client.on(Events.ChannelCreate, debounceSyncChannels);
client.on(Events.ChannelDelete, debounceSyncChannels);
client.on(Events.ChannelUpdate, debounceSyncChannels);
client.on(Events.RoleCreate, debounceSyncChannels);
client.on(Events.RoleDelete, debounceSyncChannels);
client.on(Events.RoleUpdate, debounceSyncChannels);

client.login(config.token).catch((err) => {
  console.error('❌ Impossible de se connecter :', err.message);
  process.exit(1);
});
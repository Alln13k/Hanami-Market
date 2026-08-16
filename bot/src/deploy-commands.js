import { REST, Routes } from 'discord.js';
import { config } from './config.js';
import { commands } from './commands/index.js';

const rest = new REST({ version: '10' }).setToken(config.token);

const data = commands.map((c) => c.data.toJSON());

(async () => {
  try {
    console.log(`Déploiement de ${data.length} commandes...`);
    if (config.guildId) {
      await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: data });
      console.log(`Commandes déployées sur le serveur ${config.guildId} (mode dev).`);
    } else {
      await rest.put(Routes.applicationCommands(config.clientId), { body: data });
      console.log('Commandes déployées en global (dispo partout, ~1h à propager).');
    }
  } catch (err) {
    console.error('Erreur de déploiement:', err);
    process.exit(1);
  }
})();
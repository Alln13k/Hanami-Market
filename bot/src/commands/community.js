import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { requireAdmin } from '../utils/perms.js';
import { shopEmbed, hexToInt } from '../utils/embeds.js';
import { createPoll } from '../services/polls.js';
import { getProducts, buildStockEmbed, buildStockNavRow, makeUid } from '../services/stock.js';
import { prisma } from '../prisma.js';

const MAX_OPTIONS = 9;

export const poll = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Crée un sondage interactif avec boutons de vote')
    .addStringOption((o) => o.setName('question').setDescription('La question du sondage').setRequired(true))
    .addStringOption((o) => o.setName('option1').setDescription('Option 1').setRequired(true))
    .addStringOption((o) => o.setName('option2').setDescription('Option 2').setRequired(true))
    .addStringOption((o) => o.setName('option3').setDescription('Option 3 (facultative)'))
    .addStringOption((o) => o.setName('option4').setDescription('Option 4 (facultative)'))
    .addStringOption((o) => o.setName('option5').setDescription('Option 5 (facultative)'))
    .addStringOption((o) => o.setName('option6').setDescription('Option 6 (facultative)'))
    .addStringOption((o) => o.setName('option7').setDescription('Option 7 (facultative)'))
    .addStringOption((o) => o.setName('option8').setDescription('Option 8 (facultative)'))
    .addStringOption((o) => o.setName('option9').setDescription('Option 9 (facultative)'))
    .addIntegerOption((o) => o.setName('duration').setDescription('Durée en minutes (0 ou vide = permanent)').setMinValue(0))
    .addChannelOption((o) => o.setName('channel').setDescription('Salon où afficher le sondage (défaut : ici)')),

  async execute(interaction) {
    if (!requireAdmin(interaction)) return;

    const options = [];
    for (let i = 1; i <= MAX_OPTIONS; i++) {
      const val = interaction.options.getString(`option${i}`);
      if (val) options.push(val.slice(0, 100));
    }
    if (options.length < 2) {
      return interaction.reply({ content: '❌ Il faut au moins 2 options.', ephemeral: true });
    }

    const channel = interaction.options.getChannel('channel') || interaction.channel;
    if (channel.type !== 0) {
      return interaction.reply({ content: '❌ Le salon doit être un salon texte.', ephemeral: true });
    }

    const duration = interaction.options.getInteger('duration') || 0;

    const result = await createPoll({
      channel,
      question: interaction.options.getString('question', true).slice(0, 200),
      options,
      durationMinutes: duration,
    });

    if (!result.ok) return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
    return interaction.reply({ content: `✅ Sondage créé dans <#${channel.id}> !`, ephemeral: true });
  },
};

export const remind = {
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Reçoit un rappel en message privé')
    .addIntegerOption((o) => o.setName('minutes').setDescription('Dans combien de minutes ?').setRequired(true).setMinValue(1).setMaxValue(10080))
    .addStringOption((o) => o.setName('text').setDescription('Rappel de quoi ?').setRequired(true)),

  async execute(interaction) {
    const minutes = interaction.options.getInteger('minutes', true);
    const text = interaction.options.getString('text', true).slice(0, 200);

    await interaction.reply({
      content: `⏰ D'accord, je te rappelle dans **${minutes} minute(s)** de : *${text}*`,
      ephemeral: true,
    });

    setTimeout(async () => {
      const user = await interaction.client.users.fetch(interaction.user.id).catch(() => null);
      if (user) {
        await user
          .send({ embeds: [shopEmbed('⏰ Rappel', `**${text}**\n\nIl était prévu **${minutes} minute(s)** après ta commande.`)] })
          .catch(() => {});
      }
    }, minutes * 60000);
  },
};

export const stock = {
  data: new SlashCommandBuilder()
    .setName('stock')
    .setDescription('Affiche les produits disponibles et leurs stocks'),

  async execute(interaction) {
    const products = await getProducts();
    const { embed, pages } = buildStockEmbed(products, 0);
    const row = buildStockNavRow(makeUid(), 0, pages);

    await interaction.reply({ embeds: [embed], components: row ? [row] : [] });
  },
};
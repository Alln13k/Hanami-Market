import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { prisma } from '../prisma.js';
import { shopEmbed } from '../utils/embeds.js';

export const shop = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Affiche les produits du shop'),

  async execute(interaction) {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    if (products.length === 0) {
      return interaction.reply({
        embeds: [shopEmbed('🛒 Le shop', 'Aucun produit disponible pour le moment. Reviens plus tard !')],
      });
    }

    const description = products
      .map(
        (p, i) =>
          `**${i + 1}. ${p.name}** — 💰 $${Number(p.price).toFixed(2)}\n` +
          `\`\`\`${p.description || 'Aucune description'}\`\`\``
      )
      .join('\n');

    const select = new StringSelectMenuBuilder()
      .setCustomId('select_product')
      .setPlaceholder('Choisis un produit à acheter')
      .addOptions(
        products.map((p) => ({
          label: p.name,
          description: `$${Number(p.price).toFixed(2)}`,
          value: p.id,
        }))
      );

    const row = new ActionRowBuilder().addComponents(select);

    await interaction.reply({
      embeds: [shopEmbed('🛒 Le shop', description).setTimestamp()],
      components: [row],
    });
  },
};
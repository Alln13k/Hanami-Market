import { SlashCommandBuilder } from 'discord.js';
import { prisma } from '../prisma.js';
import { shopEmbed } from '../utils/embeds.js';
import { requireAdmin } from '../utils/perms.js';

export const addstock = {
  data: new SlashCommandBuilder()
    .setName('addstock')
    .setDescription('Ajoute un article en stock pour un produit')
    .addStringOption((o) => o.setName('produit').setDescription('Nom du produit').setRequired(true))
    .addStringOption((o) => o.setName('donnee').setDescription('Le contenu à livrer (code, compte, licence...)').setRequired(true)),

  async execute(interaction) {
    if (!requireAdmin(interaction)) return;

    const name = interaction.options.getString('produit');
    const data = interaction.options.getString('donnee');

    const product = await prisma.product.findFirst({ where: { name } });
    if (!product) {
      return interaction.reply({
        embeds: [shopEmbed('❌ Produit introuvable', `Aucun produit nommé **${name}**.`)],
        ephemeral: true,
      });
    }

    await prisma.stockItem.create({
      data: { productId: product.id, data },
    });

    const count = await prisma.stockItem.count({ where: { productId: product.id, isSold: false } });

    await interaction.reply({
      embeds: [
        shopEmbed(
          '✅ Stock ajouté',
          `1 article ajouté à **${product.name}**. Stock restant : **${count}**`
        ),
      ],
      ephemeral: true,
    });
  },
};
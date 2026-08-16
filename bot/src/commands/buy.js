import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { prisma } from '../prisma.js';
import { shopEmbed } from '../utils/embeds.js';

export const buy = {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Achète un produit du shop')
    .addStringOption((o) => o.setName('produit').setDescription('Nom du produit').setRequired(true)),

  async execute(interaction) {
    const name = interaction.options.getString('produit');
    const product = await prisma.product.findFirst({
      where: { name, isActive: true },
    });

    if (!product) {
      return interaction.reply({
        embeds: [shopEmbed('❌ Produit introuvable', `Aucun produit nommé **${name}**. Utilise \`/shop\` pour voir la liste.`)],
        ephemeral: true,
      });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('💠 Litecoin')
        .setStyle(ButtonStyle.Success)
        .setCustomId(`pay_method_LITECOIN_${product.id}`),
      new ButtonBuilder()
        .setLabel('💳 PayPal')
        .setStyle(ButtonStyle.Primary)
        .setCustomId(`pay_method_PAYPAL_${product.id}`)
    );

    await interaction.reply({
      embeds: [
        shopEmbed(
          `🛒 ${product.name}`,
          `${product.description || ''}\n\n💰 **Prix : $${Number(product.price).toFixed(2)}**\n\nChoisis ta méthode de paiement :`,
          product.color
        ),
      ],
      components: [row],
      ephemeral: false,
    });
  },
};
import { SlashCommandBuilder } from 'discord.js';
import { prisma } from '../prisma.js';
import { shopEmbed } from '../utils/embeds.js';
import { requireAdmin } from '../utils/perms.js';

export const stats = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Affiche les statistiques du shop'),

  async execute(interaction) {
    if (!requireAdmin(interaction)) return;

    const [totalOrders, pending, delivered, failed, totalRevenue, productCount] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'DELIVERED' } }),
      prisma.order.count({ where: { status: 'FAILED' } }),
      prisma.order.aggregate({ _sum: { amount: true }, where: { status: 'DELIVERED' } }),
      prisma.product.count({ where: { isActive: true } }),
    ]);

    await interaction.reply({
      embeds: [
        shopEmbed(
          '📊 Statistiques du shop',
          `• **Commandes totales** : ${totalOrders}\n` +
            `• **En attente** : ${pending}\n` +
            `• **Livrées** : ${delivered}\n` +
            `• **Échouées** : ${failed}\n` +
            `• **Revenus (livrés)** : $${Number(totalRevenue._sum.amount || 0).toFixed(2)}\n` +
            `• **Produits actifs** : ${productCount}`
        ),
      ],
    });
  },
};
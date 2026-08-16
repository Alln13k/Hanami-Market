import { SlashCommandBuilder } from 'discord.js';
import { prisma } from '../prisma.js';
import { shopEmbed } from '../utils/embeds.js';
import { requireAdmin } from '../utils/perms.js';

export const confirm = {
  data: new SlashCommandBuilder()
    .setName('confirm')
    .setDescription('Confirme manuellement un paiement PayPal et déclenche la livraison')
    .addStringOption((o) => o.setName('commande').setDescription('ID de la commande').setRequired(true)),

  async execute(interaction) {
    if (!requireAdmin(interaction)) return;

    const orderId = interaction.options.getString('commande');
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      return interaction.reply({
        embeds: [shopEmbed('❌ Commande introuvable', `Aucune commande avec l'ID **${orderId}**.`)],
        ephemeral: true,
      });
    }

    if (order.status === 'PENDING') {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'PAID', paidAt: new Date() },
      });
      await interaction.reply({
        embeds: [shopEmbed('✅ Paiement confirmé', `Commande **${order.id}** marquée comme payée. Livraison en cours...`)],
        ephemeral: true,
      });
      // La livraison est déclenchée par le worker qui surveille la base
      const { deliverOrder } = await import('../services/delivery.js');
      await deliverOrder(order.id);
    } else {
      await interaction.reply({
        embeds: [shopEmbed('ℹ️ Commande déjà traitée', `Statut actuel : **${order.status}**`)],
        ephemeral: true,
      });
    }
  },
};
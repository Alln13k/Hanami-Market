import { prisma, getSetting, setSetting } from '../prisma.js';
import { buildEmbed } from './embeds.js';

function formatPrice(value) {
  return Number(value).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

// Met à jour (ou crée) l'embed public listant les produits et leurs stocks
export async function updateProductsEmbed(channelIdOverride) {
  const channelId = channelIdOverride || (await getSetting('productsEmbedChannelId'));
  if (!channelId) return { ok: true, skipped: true };

  const guild = global.client?.guilds?.cache?.first();
  const channel = guild?.channels?.cache?.get(channelId);
  if (!channel) return { ok: false, error: 'Salon introuvable' };

  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
  });

  const description = products.length
    ? products
        .map(
          (p, i) =>
            `**${i + 1}. ${p.name}**${p.salePrice ? ' 🔥' : ''}\n` +
            `💶 Prix : ${p.salePrice ? `~~${formatPrice(p.price)}~~ **${formatPrice(p.salePrice)}**` : formatPrice(p.price)}\n` +
            `📦 Stock : **${p.stock}**` +
            (p.description ? `\n${p.description}` : '')
        )
        .join('\n\n')
    : 'Aucun produit disponible pour le moment.';

  const embed = buildEmbed({
    title: '📦 Nos produits',
    description,
    color: products[0]?.color || '5865F2',
    footer: `Mis à jour le ${new Date().toLocaleString('fr-FR')}`,
    timestamp: true,
  });

  const messageId = await getSetting('productsEmbedMessageId');

  if (messageId) {
    const existing = await channel.messages.fetch(messageId).catch(() => null);
    if (existing) {
      await existing.edit({ embeds: [embed] });
      return { ok: true };
    }
  }

  const sent = await channel.send({ embeds: [embed] });
  await setSetting('productsEmbedMessageId', sent.id);
  await setSetting('productsEmbedChannelId', channelId);
  return { ok: true };
}
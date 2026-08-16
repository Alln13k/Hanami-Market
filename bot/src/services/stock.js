import { prisma } from '../prisma.js';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { hexToInt } from '../utils/embeds.js';
import { randomUUID } from 'node:crypto';

const PRODUCTS_PER_PAGE = 6; // 2 rangées de 3
const EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];

function fmt(v) {
  return Number(v).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

export async function getProducts() {
  return prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ stock: 'desc' }, { createdAt: 'asc' }],
  });
}

export function buildStockEmbed(products, page) {
  const total = products.length;
  const inStock = products.filter((p) => p.stock > 0).length;
  const pages = Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE));
  const start = page * PRODUCTS_PER_PAGE;
  const slice = products.slice(start, start + PRODUCTS_PER_PAGE);

  const fields = slice.map((p, i) => {
    const globalIdx = start + i;
    const price = p.salePrice ? `~~${fmt(p.price)}~~ **${fmt(p.salePrice)}** 🔥` : fmt(p.price);
    return {
      name: `${EMOJIS[globalIdx] || `${globalIdx + 1}.`} ${p.name}`,
      value: `${price}\n📦 Stock : **${p.stock}** ${p.stock > 0 ? '✅' : '❌'}`,
      inline: true,
    };
  });

  const embed = new EmbedBuilder()
    .setColor(hexToInt('f49ecd'))
    .setTitle('📦 Produits & stocks')
    .setDescription(
      `**${total}** produit(s) · **${inStock}** en stock · **${total - inStock}** épuisé(s)` +
        (total === 0 ? '\n\nAucun produit disponible pour le moment.' : '')
    )
    .addFields(fields.length ? fields : [{ name: '\u200b', value: '\u200b', inline: true }])
    .setFooter({ text: `Page ${page + 1}/${pages} · ${new Date().toLocaleString('fr-FR')}` })
    .setTimestamp();

  return { embed, pages, total, inStock };
}

export function buildStockNavRow(uid, page, pages) {
  if (pages <= 1) return null;
  const row = new ActionRowBuilder();
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`stock_nav_${uid}_${page - 1}`)
      .setLabel('◀')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 0)
  );
  row.addComponents(
    new ButtonBuilder()
      .setCustomId(`stock_nav_${uid}_${page + 1}`)
      .setLabel('▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= pages - 1)
  );
  return row;
}

// Navigation entre les pages du message de stock
export async function handleStockNav(interaction) {
  const match = interaction.customId.match(/^stock_nav_([^_]+)_(\d+)$/);
  if (!match) return;
  const [, uid, pageStr] = match;
  const page = parseInt(pageStr, 10) || 0;

  const products = await getProducts();
  const { embed, pages } = buildStockEmbed(products, page);
  const row = buildStockNavRow(uid, page, pages);

  await interaction.update({ embeds: [embed], components: row ? [row] : [] });
}

export function makeUid() {
  return randomUUID().slice(0, 8);
}
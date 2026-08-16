import { prisma } from '../prisma.js';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { hexToInt } from '../utils/embeds.js';
import { randomUUID } from 'node:crypto';

const MAX_PER_PAGE = 12; // produits maximum par page

function fmt(v) {
  return Number(v).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

export async function getProducts() {
  return prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ stock: 'desc' }, { createdAt: 'asc' }],
  });
}

// Une ligne par article : nom · prix · stock
function productLine(p) {
  const price = p.salePrice ? `~~${fmt(p.price)}~~ **${fmt(p.salePrice)}**` : fmt(p.price);
  return `• **${p.name}**${p.salePrice ? ' 🔥' : ''} · 💶 ${price} · 📦 ${p.stock}`;
}

// Regroupe les produits par catégorie (ordre d'apparition, les sans-catégorie à la fin)
export function buildStockLines(products) {
  const cats = new Map();
  for (const p of products) {
    const key = (p.category || '').trim() || 'Autres';
    if (!cats.has(key)) cats.set(key, []);
    cats.get(key).push(p);
  }
  return [...cats.entries()].map(([name, prods]) => ({ name, products: prods }));
}

function renderGroup(g) {
  return `📂 **${g.name}**\n${g.products.map(productLine).join('\n')}`;
}

// Description complète (groupée par catégorie) pour l'embed shop public
export function buildStockDescription(products) {
  const groups = buildStockLines(products);
  return groups.map(renderGroup).join('\n\n');
}

export function buildStockEmbed(products, page) {
  const groups = buildStockLines(products);

  // Pagination par groupes de catégories
  const pages = [];
  let cur = [];
  let count = 0;
  for (const g of groups) {
    if (cur.length && count + g.products.length > MAX_PER_PAGE) {
      pages.push(cur);
      cur = [];
      count = 0;
    }
    cur.push(g);
    count += g.products.length;
  }
  if (cur.length) pages.push(cur);

  const total = pages.length || 1;
  const p = Math.min(Math.max(0, page), total - 1);
  const inStock = products.filter((x) => x.stock > 0).length;

  const header = `**${products.length}** produit(s) · **${inStock}** en stock · **${products.length - inStock}** épuisé(s)`;
  const desc = pages.length ? renderGroup(pages[p][0]) : 'Aucun produit disponible pour le moment.';
  // Ajoute les groupes suivants de la page
  const body = pages.length ? pages[p].slice(1).map(renderGroup).join('\n\n') : '';
  const description = pages.length ? `${header}\n\n${[desc, body].filter(Boolean).join('\n\n')}` : header;

  const embed = new EmbedBuilder()
    .setColor(hexToInt('f49ecd'))
    .setTitle('📦 Produits & stocks')
    .setDescription(description)
    .setFooter({ text: `Page ${p + 1}/${total} · ${new Date().toLocaleString('fr-FR')}` })
    .setTimestamp();

  return { embed, page: p, total };
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
  const { embed, page: p, total } = buildStockEmbed(products, page);
  const row = buildStockNavRow(uid, p, total);

  await interaction.update({ embeds: [embed], components: row ? [row] : [] });
}

export function makeUid() {
  return randomUUID().slice(0, 8);
}
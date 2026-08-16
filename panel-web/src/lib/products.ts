import { prisma } from './prisma';

// Demande au bot de rafraîchir l'embed public des produits
export async function enqueueProductsUpdate(channelId?: string) {
  await prisma.botAction.create({
    data: {
      type: 'UPDATE_PRODUCTS_EMBED',
      payload: channelId ? JSON.stringify({ channelId }) : '{}',
    },
  });
}
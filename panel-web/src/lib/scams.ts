import { prisma } from './prisma';

// Demande au bot de rafraîchir l'embed public des scammeurs
export async function enqueueScamUpdate(channelId?: string) {
  await prisma.botAction.create({
    data: {
      type: 'UPDATE_SCAM_EMBED',
      payload: channelId ? JSON.stringify({ channelId }) : '{}',
    },
  });
}
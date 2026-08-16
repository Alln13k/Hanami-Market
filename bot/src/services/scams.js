import { prisma, getSetting, setSetting } from '../prisma.js';
import { buildEmbed } from './embeds.js';

// Met à jour (ou crée) l'embed public listant les scammeurs dans le salon scam
export async function updateScamEmbed(channelIdOverride) {
  const channelId = channelIdOverride || (await getSetting('scamChannelId'));
  if (!channelId) return { ok: true, skipped: true };

  const guild = global.client?.guilds?.cache?.first();
  const channel = guild?.channels?.cache?.get(channelId);
  if (!channel) return { ok: false, error: 'Salon introuvable' };

  const scammers = await prisma.scammer.findMany({ orderBy: { addedAt: 'asc' } });

  const description = scammers.length
    ? scammers
        .map(
          (s, i) =>
            `**${i + 1}. ${s.name}**${s.reason ? ` — *${s.reason}*` : ''}\n` +
            `🕒 Signalé le ${s.addedAt.toLocaleDateString('fr-FR')}`
        )
        .join('\n\n')
    : 'Aucun scammeur signalé pour le moment. ✅';

  const embed = buildEmbed({
    title: '⚠️ Scammeurs — à ne pas commander',
    description,
    color: 'ED4245',
    footer: `Mis à jour le ${new Date().toLocaleString('fr-FR')}`,
    timestamp: true,
  });

  const messageId = await getSetting('scamEmbedMessageId');

  if (messageId) {
    const existing = await channel.messages.fetch(messageId).catch(() => null);
    if (existing) {
      await existing.edit({ embeds: [embed] });
      return { ok: true };
    }
  }

  const sent = await channel.send({ embeds: [embed] });
  await setSetting('scamEmbedMessageId', sent.id);
  await setSetting('scamChannelId', channelId);
  return { ok: true };
}
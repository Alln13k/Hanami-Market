import { AttachmentBuilder } from 'discord.js';
import { prisma, getSetting } from '../prisma.js';
import { shopEmbed } from '../utils/embeds.js';

// Envoie la preuve (image + "PROOF #N") dans le salon proof configuré
export async function sendProof({ proofId }) {
  const proof = await prisma.proof.findUnique({ where: { id: Number(proofId) } });
  if (!proof) return { ok: false, error: 'Preuve introuvable' };

  const channelId = await getSetting('proofChannelId');
  if (!channelId) return { ok: false, error: 'Aucun salon de preuves configuré' };

  const guild = global.client?.guilds?.cache?.first();
  const channel = guild?.channels?.cache?.get(channelId);
  if (!channel) return { ok: false, error: 'Salon introuvable' };

  const ext = proof.mimeType.split('/')[1]?.split(';')[0] || 'png';
  const filename = `proof-${proof.number}.${ext}`;
  const file = new AttachmentBuilder(proof.image, { name: filename });

  const embed = shopEmbed(`PROOF #${proof.number}`, 'Preuve de livraison', 'f49ecd')
    .setImage(`attachment://${filename}`)
    .setTimestamp();

  await channel.send({ embeds: [embed], files: [file] });
  return { ok: true, number: proof.number };
}
import { prisma } from '@/lib/prisma';
import { BadgeCheck, Pin, Send, Info, History } from 'lucide-react';
import { VouchChannelForm } from './channel-form';
import { VouchTutorialForm } from './tutorial-form';
import { DeleteVouchButton } from './delete-vouch-button';

export const dynamic = 'force-dynamic';

export default async function VouchPage() {
  const [channels, channelSetting, titleSetting, descriptionSetting, vouches] = await Promise.all([
    prisma.guildChannel.findMany({ where: { isText: true }, orderBy: [{ position: 'asc' }] }),
    prisma.setting.findUnique({ where: { key: 'vouchChannelId' } }),
    prisma.setting.findUnique({ where: { key: 'vouchTutorialTitle' } }),
    prisma.setting.findUnique({ where: { key: 'vouchTutorialDescription' } }),
    prisma.vouch.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
  ]);

  return (
    <>
      <h1 className="page-title">Vouch</h1>
      <p className="page-sub">Les membres écrivent <code>+vouch @pseudo prix produit x1</code> : le bot confirme, réagit avec une fleur sakura et garde le tutoriel visible sous chaque vouch.</p>

      <div className="card" style={{ maxWidth: 760, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><Pin size={16} /> Salon des vouches</h2>
        <VouchChannelForm channels={channels} />
        {channelSetting?.value && (
          <p className="muted" style={{ margin: '8px 0 0', fontSize: 12 }}>
            Salon actuel : {channels.find((c) => c.channelId === channelSetting.value)?.name || channelSetting.value}
          </p>
        )}
      </div>

      <div className="card" style={{ maxWidth: 760, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><Send size={16} /> Embed du tutoriel</h2>
        <VouchTutorialForm
          initialTitle={titleSetting?.value || 'Comment poster une vouch'}
          initialDescription={descriptionSetting?.value || ''}
          channelId={channelSetting?.value || ''}
        />
      </div>

      <div className="card" style={{ maxWidth: 760, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><Info size={16} /> Format de la vouch</h2>
        <p style={{ margin: 0 }}>
          <code>+vouch @membre prix produit quantité</code>
        </p>
        <p className="muted" style={{ margin: '8px 0 0' }}>
          Exemple : <code>+vouch @Alln13k 3.57 nitro x1</code>
        </p>
        <p className="muted" style={{ margin: '8px 0 0', fontSize: 13 }}>
          Dès qu'un membre poste une vouch valide dans le salon : le bot répond « Vouch confirmé ! » (puis supprime sa réponse), réagit au message avec 🌸, supprime l'embed du tutoriel et le renvoie juste en dessous.
        </p>
      </div>

      <div className="card" style={{ maxWidth: 760 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><History size={16} /> Historique des vouches</h2>
        {vouches.length === 0 ? (
          <p className="muted">Aucune vouch pour le moment.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Postée par</th>
                <th>Pour</th>
                <th>Produit</th>
                <th>Prix</th>
                <th>Qté</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {vouches.map((v) => (
                <tr key={v.id}>
                  <td>{v.userName}</td>
                  <td><strong>{v.targetName}</strong></td>
                  <td>{v.product}</td>
                  <td>{Number(v.price).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
                  <td>x{v.quantity}</td>
                  <td className="muted">{new Date(v.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td><DeleteVouchButton id={v.id} targetName={v.targetName} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
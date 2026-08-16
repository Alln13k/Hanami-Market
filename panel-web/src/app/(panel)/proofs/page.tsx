import { prisma } from '@/lib/prisma';
import { Camera, Upload, Image } from 'lucide-react';
import { ProofChannelForm } from './channel-form';
import { SendProofForm } from './send-proof-form';

export const dynamic = 'force-dynamic';

export default async function ProofsPage() {
  const [proofs, channels, channelSetting] = await Promise.all([
    prisma.proof.findMany({ orderBy: { number: 'desc' }, take: 50 }),
    prisma.guildChannel.findMany({ where: { isText: true }, orderBy: [{ position: 'asc' }] }),
    prisma.setting.findUnique({ where: { key: 'proofChannelId' } }),
  ]);

  return (
    <>
      <h1 className="page-title">Preuves</h1>
      <p className="page-sub">Importe une capture d'écran : le bot l'envoie dans le salon choisi avec un numéro automatique (PROOF #1, #2...).</p>

      <div className="card" style={{ maxWidth: 760, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><Camera size={16} /> Salon des preuves</h2>
        <ProofChannelForm channels={channels} />
        {channelSetting?.value && (
          <p className="muted" style={{ margin: '8px 0 0', fontSize: 12 }}>
            Salon actuel : {channels.find((c) => c.channelId === channelSetting.value)?.name || channelSetting.value}
          </p>
        )}
      </div>

      <div className="card" style={{ maxWidth: 760, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><Upload size={16} /> Importer une capture d'écran</h2>
        <SendProofForm />
      </div>

      <div className="card" style={{ maxWidth: 760 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><Image size={16} /> Historique des preuves</h2>
        {proofs.length === 0 ? (
          <p className="muted">Aucune preuve envoyée pour le moment.</p>
        ) : (
          <div className="proof-grid">
            {proofs.map((p) => (
              <div key={p.id} className="proof-item">
                <img src={`/api/proofs/${p.id}/image`} alt={`PROOF #${p.number}`} />
                <div className="proof-label">
                  PROOF #{p.number}
                  <span className="muted" style={{ fontSize: 11 }}>{new Date(p.createdAt).toLocaleString('fr-FR')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
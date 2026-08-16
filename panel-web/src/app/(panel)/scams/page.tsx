import { prisma } from '@/lib/prisma';
import { Skull, Pin, Plus } from 'lucide-react';
import { ScamForm } from './scam-form';
import { RemoveScammerButton } from './remove-scammer-button';
import { ScamPublishForm } from './scam-publish-form';

export const dynamic = 'force-dynamic';

export default async function ScamsPage() {
  const [scammers, channels] = await Promise.all([
    prisma.scammer.findMany({ orderBy: { addedAt: 'desc' } }),
    prisma.guildChannel.findMany({ where: { isText: true }, orderBy: [{ position: 'asc' }] }),
  ]);

  return (
    <>
      <h1 className="page-title">Scam</h1>
      <p className="page-sub">
        Signale les personnes à ne pas commander : elles apparaissent dans l'embed du salon scam.
      </p>

      <div className="card" style={{ maxWidth: 720, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><Pin size={16} /> Embed public</h2>
        <ScamPublishForm channels={channels} />
      </div>

      <div className="card" style={{ maxWidth: 720, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><Plus size={16} /> Signaler une personne</h2>
        <ScamForm />
      </div>

      <div className="card" style={{ maxWidth: 720 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><Skull size={16} /> Scammeurs signalés</h2>
        {scammers.length === 0 ? (
          <p className="muted">Aucun scammeur signalé pour le moment.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Raison</th>
                <th>Signalé le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {scammers.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.name}</strong></td>
                  <td>{s.reason || <span className="muted">—</span>}</td>
                  <td>{s.addedAt.toLocaleDateString('fr-FR')}</td>
                  <td className="flex">
                    <RemoveScammerButton id={s.id} name={s.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
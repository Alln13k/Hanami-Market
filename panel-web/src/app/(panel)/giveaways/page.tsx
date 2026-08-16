import { prisma } from '@/lib/prisma';
import { Gift } from 'lucide-react';
import { GiveawayControls } from './giveaway-controls';

export const dynamic = 'force-dynamic';

export default async function GiveawaysPage() {
  const giveaways = await prisma.giveaway.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { entries: true } } },
    take: 100,
  });

  const running = giveaways.filter((g) => g.status === 'RUNNING').length;
  const participants = giveaways.reduce((sum, g) => sum + g._count.entries, 0);

  return (
    <>
      <h1 className="page-title">Giveaways</h1>
      <p className="page-sub">
        Lance des concours directement depuis Discord avec <code>/giveaway start</code>. Les membres cliquent sur le bouton
        « 🎉 Participer », le bot tire les gagnants automatiquement à la fin et leur envoie un message privé.
      </p>

      <div className="grid">
        <div className="card stat">
          <div className="value">{running}</div>
          <div className="label">Giveaways en cours</div>
        </div>
        <div className="card stat">
          <div className="value">{giveaways.length}</div>
          <div className="label">Giveaways au total</div>
        </div>
        <div className="card stat">
          <div className="value">{participants}</div>
          <div className="label">Participations</div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 1000, marginTop: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>
          <Gift size={16} /> Historique des giveaways
        </h2>
        <GiveawayControls giveaways={giveaways} />
      </div>
    </>
  );
}
import { prisma } from '@/lib/prisma';
import { Gift, Sparkles } from 'lucide-react';
import { GiveawayControls } from './giveaway-controls';
import { GiveawayCreateForm } from './giveaway-create-form';

export const dynamic = 'force-dynamic';

export default async function GiveawaysPage() {
  const [giveaways, channels] = await Promise.all([
    prisma.giveaway.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { entries: true } } },
      take: 100,
    }),
    prisma.guildChannel.findMany({ where: { isText: true }, orderBy: [{ position: 'asc' }] }),
  ]);

  const running = giveaways.filter((g) => g.status === 'RUNNING').length;
  const participants = giveaways.reduce((sum, g) => sum + g._count.entries, 0);

  return (
    <>
      <h1 className="page-title">Giveaways</h1>
      <p className="page-sub">
        Lance des concours depuis le site (ou avec <code>/giveaway start</code> sur Discord). Les membres cliquent sur le bouton
        « 🎉 Participer », le bot tire les gagnants automatiquement à la fin et leur envoie un message privé.
      </p>

      <div className="card" style={{ maxWidth: 1000, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}>
          <Sparkles size={16} /> Créer un giveaway
        </h2>
        <GiveawayCreateForm channels={channels.map((c) => ({ channelId: c.channelId, name: c.name }))} />
      </div>

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
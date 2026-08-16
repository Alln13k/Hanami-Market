import { prisma } from '@/lib/prisma';
import { MessageSquare, Ticket } from 'lucide-react';
import { CustomEmbedForm } from './custom-embed-form';
import { TicketButtonForm } from './ticket-button-form';

export const dynamic = 'force-dynamic';

export default async function EmbedsPage() {
  const channels = await prisma.guildChannel.findMany({
    where: { isText: true },
    orderBy: [{ position: 'asc' }],
  });

  return (
    <>
      <h1 className="page-title">Embeds</h1>
      <p className="page-sub">Envoie des messages et embeds dans les salons Discord</p>

      {channels.length === 0 ? (
        <div className="card" style={{ maxWidth: 640 }}>
          <p className="muted">
            Aucun salon synchronisé. Vérifie que le bot est en ligne : il synchronise les salons toutes les 5
            minutes. Recharge cette page après.
          </p>
        </div>
      ) : (
        <>
          <div className="card" style={{ maxWidth: 720, marginBottom: 24 }}>
            <h2 style={{ marginTop: 0, fontSize: 18 }}><MessageSquare size={16} /> Envoyer un embed custom</h2>
            <CustomEmbedForm channels={channels} />
          </div>

          <div className="card" style={{ maxWidth: 720 }}>
            <h2 style={{ marginTop: 0, fontSize: 18 }}><Ticket size={16} /> Créer un embed avec bouton &quot;Ouvrir un ticket&quot;</h2>
            <TicketButtonForm channels={channels} />
          </div>
        </>
      )}
    </>
  );
}
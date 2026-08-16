import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function TranscriptDetailPage({ params }: { params: { id: string } }) {
  const transcript = await prisma.ticketTranscript.findUnique({ where: { id: params.id } });
  if (!transcript) notFound();

  return (
    <>
      <h1 className="page-title">Transcription — {transcript.userName}</h1>
      <p className="page-sub">Ticket {transcript.type} · fermé le {new Date(transcript.closedAt).toLocaleString('fr-FR')}</p>

      <div className="card" style={{ maxWidth: 720 }}>
        <div className="row" style={{ marginBottom: 16 }}>
          <div>
            <label>Utilisateur</label>
            <p style={{ margin: '4px 0 0' }}>{transcript.userName} <span className="muted">({transcript.userId})</span></p>
          </div>
          <div>
            <label>Type</label>
            <p style={{ margin: '4px 0 0' }}>{transcript.type}</p>
          </div>
          <div>
            <label>Ouvert</label>
            <p style={{ margin: '4px 0 0' }}>{new Date(transcript.openedAt).toLocaleString('fr-FR')}</p>
          </div>
          <div>
            <label>Fermé</label>
            <p style={{ margin: '4px 0 0' }}>{new Date(transcript.closedAt).toLocaleString('fr-FR')}</p>
          </div>
        </div>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.6 }}>{transcript.content}</pre>
      </div>
    </>
  );
}
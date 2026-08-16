import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TranscriptsPage() {
  const transcripts = await prisma.ticketTranscript.findMany({
    orderBy: { closedAt: 'desc' },
    take: 200,
  });

  return (
    <>
      <h1 className="page-title">Transcriptions</h1>
      <p className="page-sub">Archives des tickets fermés (le salon Discord est supprimé)</p>

      <div className="card">
        {transcripts.length === 0 ? (
          <p className="muted">Aucune transcription pour le moment.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Type</th>
                <th>Ouvert le</th>
                <th>Fermé le</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {transcripts.map((t) => (
                <tr key={t.id}>
                  <td>{t.userName || t.userId}</td>
                  <td>{t.type}</td>
                  <td className="muted">{new Date(t.openedAt).toLocaleString('fr-FR')}</td>
                  <td className="muted">{new Date(t.closedAt).toLocaleString('fr-FR')}</td>
                  <td><Link href={`/transcripts/${t.id}`} className="btn btn-secondary btn-small">Voir</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
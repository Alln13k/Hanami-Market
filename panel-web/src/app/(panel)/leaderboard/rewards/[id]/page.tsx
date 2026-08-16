import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Gift } from 'lucide-react';
import { RewardEditForm } from './reward-edit-form';

export const dynamic = 'force-dynamic';

export default async function RewardDetailPage({ params }: { params: { id: string } }) {
  const [reward, roles] = await Promise.all([
    prisma.spendRole.findUnique({ where: { id: params.id } }),
    prisma.role.findMany({ orderBy: { position: 'desc' } }),
  ]);
  if (!reward) notFound();

  return (
    <>
      <h1 className="page-title">Palier — {reward.name}</h1>
      <p className="page-sub">Seuil de dépenses et rôle à attribuer</p>

      <div className="card" style={{ maxWidth: 720 }}>
        <h2 style={{ marginTop: 0, fontSize: 18 }}><Gift size={16} /> Modifier le palier</h2>
        <RewardEditForm reward={reward} roles={roles} />
      </div>

      <Link href="/leaderboard" className="muted" style={{ display: 'inline-block', marginTop: 16 }}>← Retour au leaderboard</Link>
    </>
  );
}
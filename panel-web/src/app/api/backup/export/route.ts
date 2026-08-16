import { NextResponse } from 'next/server';
import { exportBackup } from '@/lib/backup';

export async function GET() {
  try {
    const data = await exportBackup();
    const json = JSON.stringify(data, null, 2);
    const stamp = data.exportedAt.replace(/[:.]/g, '-');
    return new NextResponse(json, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="backup-${stamp}.json"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 });
  }
}
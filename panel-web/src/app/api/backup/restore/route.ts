import { NextRequest, NextResponse } from 'next/server';
import { importBackup } from '@/lib/backup';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Fichier de sauvegarde requis' }, { status: 400 });
    }
    const text = await (file as File).text();
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object' || !Array.isArray(data.settings)) {
      return NextResponse.json({ error: 'Format de sauvegarde invalide' }, { status: 400 });
    }
    const stats = await importBackup(data);
    return NextResponse.json({ ok: true, stats });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 });
  }
}
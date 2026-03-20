import { verifyAdmin } from '@/app/admin/_utils/utils';
import { Pack } from '@/app/admin/packs/page';
import { adminDb } from '@/app/config/firebase-admin';
import { NextResponse } from 'next/server';

export async function GET() {
  const snapshot = await adminDb.collection('apps/prego-games/packs').get();
  const roms = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return NextResponse.json(roms);
}

export async function POST(req: Request) {
  const admin = await verifyAdmin();
  if (!admin)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body: Pack = await req.json();

  console.log('body: ' + body);

  const ref = await adminDb.collection('apps/prego-games/packs').add({
    titulo: body.titulo,
    descricao: body.descricao,
    capaRef: body.capaRef,
    gamesIds: body.gamesIds,
  });

  return NextResponse.json({ id: ref.id }, { status: 201 });
}

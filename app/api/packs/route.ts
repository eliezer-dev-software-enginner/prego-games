import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../admin/_utils/utils';
import { Pack } from '../../admin/packs/page';
import { adminDb } from '../../config/firebase-admin';
//api/packs/route.ts

export async function GET() {
  const snapshot = await adminDb.collection('apps/prego-games/packs').get();
  const roms = snapshot.docs.map((doc) => {
    console.log(doc.id);
    return { ...doc.data(), id: doc.id };
  });

  return NextResponse.json(roms);
}

export async function POST(req: Request) {
  const admin = await verifyAdmin();
  if (!admin)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body: Pack = await req.json();

  console.log('body: ' + body);

  const ref = await adminDb.collection('apps/prego-games/packs').add(body);

  // Salva o id gerado dentro do próprio documento
  await ref.update({ id: ref.id });

  return NextResponse.json({ id: ref.id }, { status: 201 });
}

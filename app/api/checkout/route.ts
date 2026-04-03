import { FieldValue, Timestamp } from 'firebase-admin/firestore';
// app/api/checkout/route.ts
import { adminAuth, adminDb } from '@/app/config/firebase-admin';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = (await cookies()).get('session');
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(session.value);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { packId } = await req.json();

  if (!packId)
    return NextResponse.json({ error: 'packId obrigatório' }, { status: 400 });

  // verifica se o pack existe
  const packSnap = await adminDb
    .collection('apps/prego-games/packs')
    .doc(packId)
    .get();
  if (!packSnap.exists)
    return NextResponse.json({ error: 'Pack não encontrado' }, { status: 404 });

  // verifica se o usuário já possui o pack
  const userRef = adminDb.collection('apps/prego-games/users').doc(decoded.uid);
  const userSnap = await userRef.get();
  const userData = userSnap.data();

  const alreadyOwned = userData?.packs?.some((p: any) => p.packId === packId);
  if (alreadyOwned)
    return NextResponse.json(
      { error: 'Você já possui este pack' },
      { status: 409 },
    );

  // simula pagamento e adiciona o pack ao usuário

  //TODO: IMPLEMENTAR PAGAMENTO NO GATEWAY DE VERDADE

  await userRef.update({
    packs: FieldValue.arrayUnion({
      packId,
      purchasedAt: Timestamp.now(),
    }),
  });

  return NextResponse.json({ success: true });
}

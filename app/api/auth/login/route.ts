// app/api/auth/login/route.ts

import { adminAuth, adminDb } from '@/app/config/firebase-admin';

import { FieldValue } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { idToken } = await req.json();

  const decoded = await adminAuth.verifyIdToken(idToken);

  // cria o usuário na collection se não existir
  const userRef = adminDb.collection('apps/prego-games/users').doc(decoded.uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    await userRef.set({
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: decoded.name ?? null,
      picture: decoded.picture ?? null,
      packs: [],
      createdAt: FieldValue.serverTimestamp(),
    });
  }

  (await cookies()).set('session', idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60,
    path: '/',
  });

  return NextResponse.json({ status: 'ok' });
}

/*

Quando eu for atualizar o pagamento
import { Timestamp } from 'firebase-admin/firestore';

await userRef.update({
  packs: FieldValue.arrayUnion({
    packId: 'abc123',
    purchasedAt: Timestamp.now(),
  }),
});

*/

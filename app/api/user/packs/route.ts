// app/api/user/packs/route.ts
import { adminAuth, adminDb } from '@/app/config/firebase-admin';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = (await cookies()).get('session');
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(session.value);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userSnap = await adminDb
    .collection('apps/prego-games/users')
    .doc(decoded.uid)
    .get();

  const packs = userSnap.data()?.packs ?? [];

  return NextResponse.json(packs);
}

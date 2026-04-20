import { adminAuth, adminDb } from '../../../config/firebase-admin';

import { NextResponse } from 'next/server';
// app/api/user/roms/route.ts
import { cookies } from 'next/headers';

export async function GET() {
  const session = (await cookies()).get('session');
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let decoded: { uid: string };
  try {
    decoded = await adminAuth.verifyIdToken(session.value);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRef = adminDb.collection('apps/prego-games/users').doc(decoded.uid);
  const userSnap = await userRef.get();
  const userData = userSnap.data();

  const roms = userData?.roms ?? [];

  // Return only the romId for each rom object
  const romIds = roms.map((rom: any) => rom.romId);

  return NextResponse.json(romIds.map((id: string) => ({ romId: id })));
}

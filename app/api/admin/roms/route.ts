import { adminAuth, adminDb } from '@/app/config/firebase-admin';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

async function verifyAdmin() {
  const session = (await cookies()).get('session');
  if (!session) return null;

  const decoded = await adminAuth.verifyIdToken(session.value);
  if (decoded.uid !== process.env.ADMIN_UID) return null;

  return decoded;
}

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const snapshot = await adminDb.collection('apps/prego-games/roms').get();
  const roms = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  console.log(roms);

  return NextResponse.json(roms);
}

export async function POST(req: Request) {
  const admin = await verifyAdmin();
  if (!admin)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const ref = await adminDb.collection('apps/prego-games/roms').add(body);

  return NextResponse.json({ id: ref.id });
}

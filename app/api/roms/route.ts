import { verifyAdmin } from '@/app/admin/_utils/utils';
import { adminDb } from '@/app/config/firebase-admin';
import { NextResponse } from 'next/server';

export async function GET() {
  const admin = await verifyAdmin();
  if (!admin)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const snapshot = await adminDb.collection('apps/prego-games/roms').get();
  const roms = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return NextResponse.json(roms);
}

export async function POST(req: Request) {
  const admin = await verifyAdmin();
  if (!admin)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  const ref = await adminDb.collection('apps/prego-games/roms').add(body);

  return NextResponse.json({ id: ref.id }, { status: 201 });
}

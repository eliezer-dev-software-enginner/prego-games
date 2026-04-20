// app/api/roms/route.ts

import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../admin/_utils/utils';
import { adminDb } from '../../config/firebase-admin';

export async function GET() {
  // Allow anyone to fetch the list of ROMs (for display) but without the download URL
  const snapshot = await adminDb.collection('apps/prego-games/roms').get();
  const roms = snapshot.docs.map((doc) => {
    const data = doc.data();
    // Return only the fields needed for display (exclude pathRef for security)
    const { pathRef, ...rest } = data;
    return { id: doc.id, ...rest };
  });

  return NextResponse.json(roms);
}

export async function POST(req: Request) {
  const admin = await verifyAdmin();
  if (!admin)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  // Ensure we don't store the pathRef in the body? Actually, we want to store it in the database.
  // The pathRef is needed for the download, so we keep it in the database.
  const ref = await adminDb.collection('apps/prego-games/roms').add(body);

  return NextResponse.json({ id: ref.id }, { status: 201 });
}

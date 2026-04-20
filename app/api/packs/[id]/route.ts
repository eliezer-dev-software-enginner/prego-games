// app/api/packs/[id]/route.ts

import { NextResponse } from 'next/server';
import { Pack } from '../../../admin/packs/page';
import { adminDb } from '../../../config/firebase-admin';
import { verifyAdmin } from '../../../admin/_utils/utils';

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const snap = await adminDb.collection('apps/prego-games/packs').doc(id).get();

  if (!snap.exists)
    return NextResponse.json({ error: 'Pack não encontrado' }, { status: 404 });

  return NextResponse.json({ id: snap.id, ...snap.data() });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await verifyAdmin();
  if (!admin)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body: Pack = await req.json();

  await adminDb.collection('apps/prego-games/packs').doc(id).update(body);

  return NextResponse.json({ id });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await verifyAdmin();
  if (!admin)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  await adminDb.collection('apps/prego-games/packs').doc(id).delete();

  return NextResponse.json({ id });
}

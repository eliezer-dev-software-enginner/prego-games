import { verifyAdmin } from '@/app/admin/_utils/utils';
import { adminDb } from '@/app/config/firebase-admin';
import { NextResponse } from 'next/server';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await verifyAdmin();
  if (!admin)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  await adminDb.collection('apps/prego-games/packs').doc(id).update({
    titulo: body.titulo,
    descricao: body.descricao,
    'capa-ref': body['capa-ref'],
    'path-ref': body['path-ref'],
  });

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

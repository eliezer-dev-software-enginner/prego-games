// app/api/checkout/rom/route.ts

import { adminAuth, adminDb } from '../../../config/firebase-admin';

import { NextResponse } from 'next/server';
import { PixService } from 'pix_generator';
import { Timestamp } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';
import { pixAccessToken } from '../../../lib/common';

export async function POST(req: Request) {
  const session = (await cookies()).get('session');
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let decoded: { uid: string; email?: string; name?: string };
  try {
    decoded = await adminAuth.verifyIdToken(session.value);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { romId } = await req.json();
  if (!romId)
    return NextResponse.json({ error: 'romId obrigatório' }, { status: 400 });

  const romSnap = await adminDb
    .collection('apps/prego-games/roms')
    .doc(romId)
    .get();

  if (!romSnap.exists)
    return NextResponse.json({ error: 'Rom não encontrada' }, { status: 404 });

  const romData = romSnap.data();

  const userRef = adminDb.collection('apps/prego-games/users').doc(decoded.uid);
  const userSnap = await userRef.get();
  const userData = userSnap.data();

  const alreadyOwned = userData?.roms?.some((r: any) => r.romId === romId);
  if (alreadyOwned)
    return NextResponse.json(
      { error: 'Você já possui esta ROM' },
      { status: 409 },
    );

  try {
    const pixService = new PixService(pixAccessToken);

    const result = await pixService.createPixPayment({
      email: decoded.email ?? 'comprador@pregogames.com',
      firstName: decoded.name?.split(' ')[0] ?? 'Comprador',
      lastName: decoded.name?.split(' ').slice(1).join(' ') ?? '',
      description: romData?.titulo ?? 'ROM de jogo',
      value: romData?.preco ?? 1,
      externalRef: `${decoded.uid}_${romId}`, // 👈 importante
      metadata: {
        userId: decoded.uid,
        romId,
      },
    });

    if (!result.success || !result.data) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const { paymentId, status, qrCode, qrCodeBase64 } = result.data;

    await adminDb.collection('apps/prego-games/payments').doc(paymentId).set({
      userId: decoded.uid,
      romId,
      status: status,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({
      success: true,
      paymentId,
      status,
      qrCodeBase64,
      qrCode,
    });
  } catch (error: any) {
    console.error('Erro ao criar pagamento:', error?.message || error);
    return NextResponse.json(
      { error: 'Erro ao criar pagamento', message: error?.message },
      { status: 500 },
    );
  }
}

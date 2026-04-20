// app/api/checkout/rom/route.ts

import { adminAuth, adminDb } from '../../../config/firebase-admin';

import { Timestamp } from 'firebase-admin/firestore';
import { Payment } from 'mercadopago';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import client from '../../../lib/mercadoPago';

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
    const payment = new Payment(client);

    const result = await payment.create({
      body: {
        transaction_amount: romData?.preco ?? 1,
        description: romData?.titulo ?? 'ROM de jogo',
        payment_method_id: 'pix',
        payer: {
          email: decoded.email ?? 'comprador@pregogames.com',
          first_name: decoded.name?.split(' ')[0] ?? 'Comprador',
          last_name: decoded.name?.split(' ').slice(1).join(' ') ?? '',
        },
        metadata: {
          userId: decoded.uid,
          romId,
        },
      },
    });

    const paymentId = String(result.id);

    await adminDb
      .collection('apps/prego-games/payments')
      .doc(paymentId)
      .set({
        userId: decoded.uid,
        romId,
        status: result.status ?? 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

    return NextResponse.json({
      success: true,
      paymentId,
      status: result.status,
      qrCodeBase64:
        result.point_of_interaction?.transaction_data?.qr_code_base64 ?? null,
      qrCode: result.point_of_interaction?.transaction_data?.qr_code ?? null,
    });
  } catch (error: any) {
    console.error('Erro ao criar pagamento:', error?.message || error);
    return NextResponse.json(
      { error: 'Erro ao criar pagamento', message: error?.message },
      { status: 500 },
    );
  }
}

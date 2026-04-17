// app/api/checkout/webhook/route.ts

import { FieldValue, Timestamp } from 'firebase-admin/firestore';

import { adminDb } from '@/app/config/firebase-admin';
import client from '@/app/lib/mercadoPago';
import { Payment } from 'mercadopago';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const paymentId = body?.data?.id;

    console.log('-----requisição chegou: paymentId: ' + paymentId);

    if (!paymentId)
      return NextResponse.json(
        { error: 'paymentId não encontrado' },
        { status: 400 },
      );

    const paymentIdStr = String(paymentId);

    // ID de teste do Mercado Pago
    if (paymentIdStr === '123456') {
      console.log('📝 Teste de webhook recebido');
      return NextResponse.json({ received: true, test: true });
    }

    const payment = new Payment(client);
    const result = await payment.get({ id: paymentIdStr });

    console.log('-----busca de payment: ');
    console.log(result);

    const novoStatus: string = result.status ?? 'unknown';

    // Atualiza o status do pagamento no Firestore
    const paymentRef = adminDb
      .collection('apps/prego-games/payments')
      .doc(paymentIdStr);
    await paymentRef.update({ status: novoStatus, updatedAt: Timestamp.now() });

    if (novoStatus === 'approved') {
      console.log('✅ Pagamento aprovado:', paymentId);

      const paymentSnap = await paymentRef.get();
      const paymentData = paymentSnap.data();

      if (paymentData?.userId && paymentData?.packId) {
        const userRef = adminDb
          .collection('apps/prego-games/users')
          .doc(paymentData.userId);

        await userRef.update({
          packs: FieldValue.arrayUnion({
            packId: paymentData.packId,
            purchasedAt: Timestamp.now(),
          }),
        });

        console.log(
          `🎮 Pack ${paymentData.packId} liberado para ${paymentData.userId}`,
        );
      }

      if (paymentData?.userId && paymentData?.romId) {
        const userRef = adminDb
          .collection('apps/prego-games/users')
          .doc(paymentData.userId);

        await userRef.update({
          roms: FieldValue.arrayUnion({
            romId: paymentData.romId,
            purchasedAt: Timestamp.now(),
          }),
        });

        console.log(
          `🎮 ROM ${paymentData.romId} liberada para ${paymentData.userId}`,
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Erro no webhook:', error.message || error);
    return NextResponse.json(
      {
        error: 'Erro no webhook',
        message: error.message ?? 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}

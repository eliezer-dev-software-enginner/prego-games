// app/api/checkout/route.ts

import { adminAuth, adminDb } from '../../config/firebase-admin';

import { Timestamp } from 'firebase-admin/firestore';
import { Payment } from 'mercadopago';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import client from '../../lib/mercadoPago';

export async function POST(req: Request) {
  // 1. Autenticação via session cookie
  const session = (await cookies()).get('session');
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let decoded: { uid: string; email?: string; name?: string };
  try {
    decoded = await adminAuth.verifyIdToken(session.value);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Valida o corpo da requisição
  const { packId } = await req.json();
  if (!packId)
    return NextResponse.json({ error: 'packId obrigatório' }, { status: 400 });

  // 3. Verifica se o pack existe no Firestore
  const packSnap = await adminDb
    .collection('apps/prego-games/packs')
    .doc(packId)
    .get();

  if (!packSnap.exists)
    return NextResponse.json({ error: 'Pack não encontrado' }, { status: 404 });

  const packData = packSnap.data();

  // 4. Verifica se o usuário já possui o pack
  const userRef = adminDb.collection('apps/prego-games/users').doc(decoded.uid);
  const userSnap = await userRef.get();
  const userData = userSnap.data();

  const alreadyOwned = userData?.packs?.some((p: any) => p.packId === packId);
  if (alreadyOwned)
    return NextResponse.json(
      { error: 'Você já possui este pack' },
      { status: 409 },
    );

  // 5. Gera o pagamento PIX via Mercado Pago
  try {
    const payment = new Payment(client);

    const result = await payment.create({
      body: {
        transaction_amount: packData?.preco ?? 1,
        description: packData?.titulo ?? 'Pack de jogos',
        payment_method_id: 'pix',
        payer: {
          email: decoded.email ?? 'comprador@pregogames.com',
          first_name: decoded.name?.split(' ')[0] ?? 'Comprador',
          last_name: decoded.name?.split(' ').slice(1).join(' ') ?? '',
        },
        metadata: {
          userId: decoded.uid,
          packId,
        },
      },
    });

    const paymentId = String(result.id);

    console.log('pagamento gerado');
    console.log(paymentId);
    console.log(payment);

    // 6. Salva o pagamento pendente no Firestore
    await adminDb
      .collection('apps/prego-games/payments')
      .doc(paymentId)
      .set({
        userId: decoded.uid,
        packId,
        status: result.status ?? 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

    console.log('pagamento salvo em apps/prego-games/payments');

    // 7. Retorna os dados do PIX para o frontend exibir
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

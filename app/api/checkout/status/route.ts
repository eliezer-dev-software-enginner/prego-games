// app/api/checkout/status/route.ts

import { NextRequest, NextResponse } from 'next/server';

import { adminDb } from '../../../config/firebase-admin';

export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get('paymentId');

  if (!paymentId)
    return NextResponse.json(
      { error: 'paymentId obrigatório' },
      { status: 400 },
    );

  const snap = await adminDb
    .collection('apps/prego-games/payments')
    .doc(paymentId)
    .get();

  if (!snap.exists)
    return NextResponse.json(
      { error: 'Pagamento não encontrado' },
      { status: 404 },
    );

  return NextResponse.json({ status: snap.data()?.status });
}

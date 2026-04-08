'use server';

import { grantUserAccess, savePayment } from '@/app/lib/db';

import client from '@/app/lib/mercadoPago';
import { Payment } from 'mercadopago';

export async function createPixPayment(userId: string) {
  'use server';

  try {
    const payment = new Payment(client);

    const response = await payment.create({
      body: {
        transaction_amount: 54.5,
        description: 'Prego games - Compra de pack',
        payment_method_id: 'pix',
        payer: {
          email: process.env.EMAIL || 'cliente@exemplo.com',
          first_name: 'Cliente',
          last_name: 'Prego games',
        },
        external_reference: userId,
      },
    });

    const qrCodeBase64 =
      response.point_of_interaction?.transaction_data?.qr_code_base64;
    const qrCode = response.point_of_interaction?.transaction_data?.qr_code;
    const paymentId = String(response.id);
    const status = response.status || 'pending';

    if (paymentId && paymentId !== 'undefined') {
      await savePayment(paymentId, userId, status);
    }

    return {
      success: true,
      paymentId,
      qrCodeBase64,
      qrCode,
      status: response.status,
    };
  } catch (error: any) {
    console.error('Erro ao criar pagamento PIX:', error);
    return {
      success: false,
      error: error.message || 'Erro ao criar pagamento',
    };
  }
}

export async function checkPaymentStatus(paymentId: string) {
  'use server';

  try {
    const payment = new Payment(client);
    const result = await payment.get({ id: paymentId });

    return {
      success: true,
      status: result.status,
    };
  } catch (error: any) {
    console.error('Erro ao verificar pagamento:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function syncPaymentStatus(paymentId: string, userId: string) {
  'use server';

  try {
    const payment = new Payment(client);
    const result = await payment.get({ id: paymentId });
    const status = result.status;

    if (status === 'approved') {
      await grantUserAccess(userId, paymentId);
      return { success: true, status, accessGranted: true };
    }

    return { success: true, status, accessGranted: false };
  } catch (error: any) {
    console.error('Erro ao sincronizar pagamento:', error);
    return { success: false, error: error.message };
  }
}

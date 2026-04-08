import { MercadoPagoConfig } from 'mercadopago';
import { isProductionMode } from '@/app/lib/common';

const isProd = isProductionMode();

const client = new MercadoPagoConfig({
  accessToken: isProd
    ? process.env.MP_ACCESS_TOKEN_PROD || ''
    : process.env.MP_ACCESS_TOKEN_TEST || '',
});

console.log('------cliente-------------');
console.log(client);

export default client;

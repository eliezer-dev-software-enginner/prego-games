// app/api/auth/login/route.ts

import { adminAuth } from '@/app/config/firebase-admin';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { idToken } = await req.json();

  // verifica se o token é válido antes de criar o cookie
  await adminAuth.verifyIdToken(idToken);

  (await cookies()).set('session', idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60, // 1 hora
    path: '/',
  });

  return NextResponse.json({ status: 'ok' });
}

// app/roms/page.tsx

import { adminAuth, adminDb } from '@/app/config/firebase-admin';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Page() {
  const session = (await cookies()).get('session');

  if (!session) redirect('/auth/login');

  try {
    // verifica se o token ainda é válido
    await adminAuth.verifyIdToken(session.value);
  } catch {
    redirect('/auth/login');
  }

  const snapshot = await adminDb.collection('apps/prego-games/roms').get();
  const roms = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return (
    <div>
      <h1>Jogos</h1>
      <ul>
        {roms.map((rom: any) => (
          <li key={rom.id}>
            <h2>{rom.titulo}</h2>
            <p>{rom.descricao}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// O fluxo completo agora está fechado:

// login → signInWithPopup → idToken
//       → POST /api/auth/login → verifyIdToken → cookie httpOnly
//       → /roms → verifyIdToken(cookie) → busca Firestore → renderiza

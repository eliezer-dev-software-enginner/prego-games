'use client';

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

import { auth } from '@/app/config/firebase';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();

  async function handleGoogleLogin() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user; // dados do usuário
    //const user = user_;
    console.log(user);

    const idToken = await user.getIdToken();
    await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    router.push('/admin/roms');
  }

  return (
    <div>
      <h1>Seja bem vindo a Prego Games - realize seu cadastro</h1>
      <button onClick={handleGoogleLogin}>Entrar com Google</button>
    </div>
  );
}

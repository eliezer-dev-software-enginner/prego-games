//#app/auth.page.tsx

'use client';

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

import { auth } from '@/app/config/firebase';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import styles from './page.module.css';

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      router.push('/packs');
    } catch (e: any) {
      if (e.code !== 'auth/popup-closed-by-user') {
        alert('Erro ao entrar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.root}>
      {/* Lado esquerdo — branding */}
      <div className={styles.left}>
        <div className={styles.leftGrid} />
        <div className={styles.leftGlow} />

        <a href='/' className={styles.logo}>
          Prego<span className={styles.logoAccent}>.</span>Games
        </a>

        <div className={styles.leftContent}>
          <p className={styles.tagline}>Plataforma de jogos retrô</p>
          <h2 className={styles.leftTitle}>
            Sua coleção
            <span>começa aqui</span>
          </h2>
          <p className={styles.leftDesc}>
            Acesse packs com os melhores jogos clássicos reunidos em um só
            lugar. Compre uma vez, jogue para sempre.
          </p>
        </div>

        <div className={styles.features}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>🎮</div>
            <span>Centenas de jogos em cada pack</span>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>⚡</div>
            <span>Acesso imediato após a compra</span>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>♾️</div>
            <span>Licença vitalícia, sem assinatura</span>
          </div>
        </div>
      </div>

      {/* Lado direito — formulário */}
      <div className={styles.right}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h1 className={styles.cardTitle}>Entrar na conta</h1>
            <p className={styles.cardSub}>
              Use sua conta Google para acessar sua biblioteca de jogos
            </p>
          </div>

          <div className={styles.divider}>Vamos lá</div>

          <button
            className={styles.btnGoogle}
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.btnLoading}>
                <span className={styles.spinner} />
                Entrando...
              </span>
            ) : (
              <>
                {/* SVG oficial do Google */}
                <svg className={styles.googleIcon} viewBox='0 0 24 24'>
                  <path
                    fill='#4285F4'
                    d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                  />
                  <path
                    fill='#34A853'
                    d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                  />
                  <path
                    fill='#FBBC05'
                    d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z'
                  />
                  <path
                    fill='#EA4335'
                    d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                  />
                </svg>
                Continuar com Google
              </>
            )}
          </button>

          <p className={styles.terms}>
            Ao entrar, você concorda com nossos <a href='#'>Termos de uso</a> e{' '}
            <a href='#'>Política de privacidade</a>
          </p>
        </div>
      </div>
    </div>
  );
}

// app/roms/page.tsx

import { adminAuth, adminDb } from '@/app/config/firebase-admin';

import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import styles from './page.module.css';

type Rom = {
  id: string;
  titulo: string;
  descricao: string;
  capaRef: string;
  pathRef: string;
};

export default async function Page() {
  const session = (await cookies()).get('session');

  if (!session) redirect('/auth/login');

  try {
    await adminAuth.verifyIdToken(session.value);
  } catch {
    redirect('/auth/login');
  }

  const snapshot = await adminDb.collection('apps/prego-games/roms').get();
  const roms = snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() }) as Rom,
  );

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <Link href='/' className={styles.logo}>
          Prego<span className={styles.logoAccent}>.</span>Games
        </Link>
      </header>

      <div className={styles.divider} />

      <div className={styles.hero}>
        <p className={styles.heroLabel}>Biblioteca</p>
        <h1 className={styles.heroTitle}>Jogos</h1>
        <p className={styles.heroCount}>{roms.length} jogos disponíveis</p>
      </div>

      <div className={styles.container}>
        {roms.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🕹️</div>
            <p className={styles.emptyText}>
              Nenhum jogo disponível no momento.
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {roms.map((rom) => (
              <div key={rom.id} className={styles.card}>
                <div className={styles.coverWrapper}>
                  {rom.capaRef ? (
                    <img
                      src={rom.capaRef}
                      alt={rom.titulo}
                      className={styles.cardCover}
                    />
                  ) : (
                    <div className={styles.coverPlaceholder}>🎮</div>
                  )}
                </div>
                <div className={styles.cardBody}>
                  <h2 className={styles.cardTitle}>{rom.titulo}</h2>
                  <p className={styles.cardDesc}>{rom.descricao}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

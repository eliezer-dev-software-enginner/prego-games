import { adminDb } from '@/app/config/firebase-admin';
import Link from 'next/link';
import { Pack } from './admin/packs/page';
import styles from './page.module.css';

async function getPacks(): Promise<Pack[]> {
  const snapshot = await adminDb.collection('apps/prego-games/packs').get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Pack);
}

export default async function Home() {
  const packs = await getPacks();

  return (
    <main className={styles.root}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroGrid} />
        <div className={styles.heroGlow} />

        <span className={styles.badge}>🎮 Jogos clássicos reunidos</span>

        <h1 className={styles.heroTitle}>
          Prego
          <span>Games</span>
        </h1>

        <p className={styles.heroSub}>
          Coleções cuidadosamente selecionadas dos melhores jogos retrô. Escolha
          seu pack e jogue agora.
        </p>

        <div className={styles.heroCta}>
          <a href='#packs' className={styles.btnPrimary}>
            Ver packs
          </a>
          <Link href='/auth/login' className={styles.btnSecondary}>
            Entrar
          </Link>
        </div>

        <div className={styles.scrollHint}>
          <span>scroll</span>
          <div className={styles.scrollLine} />
        </div>
      </section>

      <div className={styles.divider} />

      {/* Packs */}
      <section className={styles.section} id='packs'>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionLabel}>Coleções</p>
            <h2 className={styles.sectionTitle}>Packs disponíveis</h2>
          </div>
          <Link href='/packs' className={styles.btnPrimary}>
            Acessar biblioteca
          </Link>
        </div>

        {packs.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🕹️</div>
            <p className={styles.emptyText}>
              Nenhum pack disponível ainda. Volte em breve!
            </p>
          </div>
        ) : (
          <div className={styles.packsGrid}>
            {packs.map((pack) => (
              <Link
                href='/auth/login'
                key={pack.id}
                className={styles.packCard}
              >
                {pack.capaRef ? (
                  <img
                    src={pack.capaRef}
                    alt={pack.titulo}
                    className={styles.packCover}
                  />
                ) : (
                  <div className={styles.packCoverPlaceholder}>🎮</div>
                )}
                <div className={styles.packBody}>
                  <h3 className={styles.packTitle}>{pack.titulo}</h3>
                  <p className={styles.packDesc}>{pack.descricao}</p>
                  <div className={styles.packMeta}>
                    <span className={styles.packCount}>
                      {pack.gamesIds?.length ?? 0} jogos incluídos
                    </span>
                    <div className={styles.packArrow}>→</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerLogo}>Prego Games</div>
        <p>© {new Date().getFullYear()} · Todos os direitos reservados</p>
      </footer>
    </main>
  );
}

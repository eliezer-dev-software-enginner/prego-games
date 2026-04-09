// app/packs/[id]/page.tsx

import { adminAuth, adminDb } from '@/app/config/firebase-admin';

import { Pack } from '@/app/admin/packs/page';
import { Rom } from '@/app/admin/roms/page';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DownloadButton from './DownloadButton';
import styles from './page.module.css';

async function getPackWithRoms(packId: string) {
  const packSnap = await adminDb
    .collection('apps/prego-games/packs')
    .doc(packId)
    .get();

  if (!packSnap.exists) return null;

  const pack = { id: packSnap.id, ...packSnap.data() } as Pack;

  // Busca as ROMs do pack em paralelo
  const romSnaps = await Promise.all(
    (pack.gamesIds ?? []).map((romId) =>
      adminDb.collection('apps/prego-games/roms').doc(romId).get(),
    ),
  );

  const roms = romSnaps
    .filter((snap) => snap.exists)
    .map((snap) => ({ id: snap.id, ...snap.data() }) as Rom);

  return { pack, roms };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 1. Autenticação
  const session = (await cookies()).get('session');
  if (!session) redirect('/auth');

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(session.value);
    uid = decoded.uid;
  } catch {
    redirect('/auth');
  }

  // 2. Verifica se o usuário possui o pack
  const userSnap = await adminDb
    .collection('apps/prego-games/users')
    .doc(uid)
    .get();

  const userData = userSnap.data();
  const ownsPack = userData?.packs?.some((p: any) => p.packId === id);

  if (!ownsPack) redirect('/packs');

  // 3. Busca pack e ROMs
  const data = await getPackWithRoms(id);
  if (!data) redirect('/packs');

  const { pack, roms } = data;

  return (
    <div className={styles.root}>
      {/* Header */}
      <header className={styles.header}>
        <a href='/packs' className={styles.logo}>
          Prego<span className={styles.logoAccent}>.</span>Games
        </a>
        <a href='/packs' className={styles.btnBack}>
          ← Voltar
        </a>
      </header>

      {/* Hero do pack */}
      <div className={styles.packHero}>
        {pack.capaRef ? (
          <img
            src={pack.capaRef}
            alt={pack.titulo}
            className={styles.packCover}
          />
        ) : (
          <div className={styles.packCoverPlaceholder}>🎮</div>
        )}
        <div className={styles.packHeroOverlay} />
        <div className={styles.packHeroContent}>
          <p className={styles.pageLabel}>Pack de jogos</p>
          <h1 className={styles.packTitle}>{pack.titulo}</h1>
          <p className={styles.packDesc}>{pack.descricao}</p>
          <div className={styles.packMeta}>
            <span className={styles.packMetaItem}>
              🎮 {roms.length} jogo{roms.length !== 1 ? 's' : ''}
            </span>
            <span className={styles.packMetaItem}>✓ Acesso vitalício</span>
          </div>
        </div>
      </div>

      {/* Lista de ROMs */}
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Jogos do pack</h2>
        <div className={styles.romList}>
          {roms.map((rom) => (
            <div key={rom.id} className={styles.romCard}>
              {rom.capaRef ? (
                <img
                  src={rom.capaRef}
                  alt={rom.titulo}
                  className={styles.romCover}
                />
              ) : (
                <div className={styles.romCoverPlaceholder}>🕹️</div>
              )}
              <div className={styles.romInfo}>
                <h3 className={styles.romTitle}>{rom.titulo}</h3>
                {rom.descricao && (
                  <p className={styles.romDesc}>{rom.descricao}</p>
                )}
              </div>
              <DownloadButton url={rom.pathRef} filename={rom.titulo} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

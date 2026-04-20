// app/home/page.tsx
'use client';

import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PixModal from '../components/PixModal/PixModal';
import { auth } from '../config/firebase';
import { setSEOMetadata } from '../lib/common';
import styles from './page.module.css';

interface Pack {
  id: string;
  titulo: string;
  descricao: string;
  capaRef: string;
  gamesIds?: string[];
  preco: number;
}

interface Rom {
  id: string;
  titulo: string;
  descricao: string;
  capaRef: string;
  pathRef: string;
  preco: number;
}

interface PixData {
  success: boolean;
  paymentId?: string;
  qrCodeBase64?: string | null;
  qrCode?: string | null;
  status?: string;
  error?: string;
}

export default function Page() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [roms, setRoms] = useState<Rom[]>([]);
  const [ownedPackIds, setOwnedPackIds] = useState<string[]>([]);
  const [ownedRomIds, setOwnedRomIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<{
    type: 'pack' | 'rom';
    data: Pack | Rom;
  } | null>(null);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push('/auth');
        return;
      }
      setUser(u);
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  useEffect(() => {
    setSEOMetadata({
      title: 'Prego Games - Biblioteca de Jogos Retro',
      description:
        'Acesse sua biblioteca de jogos retro. Compre packs ou jogos avulsos.',
      url: 'https://pregogames.com/home',
      image: 'https://pregogames.com/og-image.png',
      keywords:
        'jogos retro, packs de jogos, roms, nintendo, snes, mega drive, playstation',
    });
  }, []);

  async function fetchData() {
    try {
      const [packsRes, romsRes, userPacksRes, userRomsRes] = await Promise.all([
        fetch('/api/packs'),
        fetch('/api/roms'),
        fetch('/api/user/packs'),
        fetch('/api/user/roms'),
      ]);

      const packsData = await packsRes.json();
      const romsData = await romsRes.json();
      const userPacksData = await userPacksRes.json();
      const userRomsData = await userRomsRes.json();

      setPacks(packsData);
      setRoms(romsData);
      setOwnedPackIds(userPacksData.map((p: { packId: string }) => p.packId));
      setOwnedRomIds(userRomsData.map((r: { romId: string }) => r.romId));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectItem(type: 'pack' | 'rom', data: Pack | Rom) {
    setSelectedItem({ type, data });
    setPixData(null);
  }

  async function handleBuy() {
    if (!selectedItem) return;
    setBuying(true);

    try {
      const endpoint =
        selectedItem.type === 'pack' ? '/api/checkout' : '/api/checkout/rom';
      const body =
        selectedItem.type === 'pack'
          ? { packId: selectedItem.data.id }
          : { romId: selectedItem.data.id };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data: PixData = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? 'Erro ao gerar pagamento');
      }

      setPixData(data);
    } catch (e: any) {
      alert(e.message);
      setSelectedItem(null);
    } finally {
      setBuying(false);
    }
  }

  async function handlePaymentConfirmed() {
    setPixData(null);
    setSelectedItem(null);
    await fetchData();
  }

  function handleCloseModals() {
    setPixData(null);
    setSelectedItem(null);
  }

  async function handleLogout() {
    await signOut(auth);
    router.push('/auth');
  }

  if (!user) return null;

  const myPacks = packs.filter((p) => ownedPackIds.includes(p.id));
  const myRoms = roms.filter((r) => ownedRomIds.includes(r.id));
  const availablePacks = packs.filter((p) => !ownedPackIds.includes(p.id));
  const availableRoms = roms.filter((r) => !ownedRomIds.includes(r.id));

  return (
    <main className={styles.root}>
      <header className={styles.header}>
        <Link href='/home' className={styles.logo}>
          Prego<span className={styles.logoAccent}>.</span>Games
        </Link>
        <div className={styles.headerRight}>
          <div className={styles.userInfo}>
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName ?? ''}
                className={styles.userAvatar}
              />
            ) : (
              <div className={styles.userAvatarPlaceholder}>👤</div>
            )}
            <span className={styles.userName}>
              {user.displayName?.split(' ')[0]}
            </span>
          </div>
          <button className={styles.btnLogout} onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>

      <div className={styles.hero}>
        <span className={styles.heroLabel}>Biblioteca</span>
        <h1 className={styles.heroTitle}>
          Olá, {user.displayName?.split(' ')[0]}!
        </h1>
        <p className={styles.heroSub}>Bem-vindo à sua biblioteca de jogos.</p>
      </div>

      <div className={styles.divider} />

      {/* My Collection */}
      {(myPacks.length > 0 || myRoms.length > 0) && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionLabel}>Minha coleção</p>
              <h2 className={styles.sectionTitle}>Jogos adquiridos</h2>
            </div>
            <Link href='/user/roms' className={styles.btnLink}>
              Ver todos →
            </Link>
          </div>

          <div className={styles.grid}>
            {myPacks.map((pack) => (
              <Link
                href={`/packs/${pack.id}`}
                key={pack.id}
                className={styles.card}
              >
                {pack.capaRef ? (
                  <img
                    src={pack.capaRef}
                    alt={pack.titulo}
                    className={styles.cardCover}
                  />
                ) : (
                  <div className={styles.cardCoverPlaceholder}>🎮</div>
                )}
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{pack.titulo}</h3>
                  <div className={styles.cardMeta}>
                    <span>{pack.gamesIds?.length ?? 0} jogos</span>
                    <span className={styles.cardBadgeOwned}>✓ Adquirido</span>
                  </div>
                </div>
              </Link>
            ))}
            {myRoms.map((rom) => (
              <a
                key={rom.id}
                href={rom.pathRef}
                target='_blank'
                rel='noopener noreferrer'
                className={styles.card}
              >
                {rom.capaRef ? (
                  <img
                    src={rom.capaRef}
                    alt={rom.titulo}
                    className={styles.cardCover}
                  />
                ) : (
                  <div className={styles.cardCoverPlaceholder}>🕹️</div>
                )}
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{rom.titulo}</h3>
                  <div className={styles.cardMeta}>
                    <span className={styles.cardPrice}>
                      R$ {rom.preco?.toFixed(2)}
                    </span>
                    <span className={styles.cardBadgeOwned}>✓ Adquirido</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Available Packs */}
      {availablePacks.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionLabel}>Loja</p>
              <h2 className={styles.sectionTitle}>Packs disponíveis</h2>
            </div>
            <Link href='/packs' className={styles.btnLink}>
              Ver todos →
            </Link>
          </div>

          <div className={styles.grid}>
            {availablePacks.slice(0, 3).map((pack) => (
              <div key={pack.id} className={styles.card}>
                {pack.capaRef ? (
                  <img
                    src={pack.capaRef}
                    alt={pack.titulo}
                    className={styles.cardCover}
                  />
                ) : (
                  <div className={styles.cardCoverPlaceholder}>🎮</div>
                )}
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{pack.titulo}</h3>
                  <p className={styles.cardDesc}>{pack.descricao}</p>
                  <div className={styles.cardMeta}>
                    <span>{pack.gamesIds?.length ?? 0} jogos</span>
                    <span className={styles.cardBadge}>Pack</span>
                  </div>
                  <button
                    className={styles.btnBuy}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectItem('pack', pack);
                    }}
                  >
                    Comprar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Available Roms */}
      {availableRoms.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionLabel}>Loja</p>
              <h2 className={styles.sectionTitle}>Jogos avulsos</h2>
            </div>
            <Link href='/roms' className={styles.btnLink}>
              Ver todos →
            </Link>
          </div>

          <div className={styles.grid}>
            {availableRoms.slice(0, 4).map((rom) => (
              <div key={rom.id} className={styles.card}>
                {rom.capaRef ? (
                  <img
                    src={rom.capaRef}
                    alt={rom.titulo}
                    className={styles.cardCover}
                  />
                ) : (
                  <div className={styles.cardCoverPlaceholder}>🕹️</div>
                )}
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{rom.titulo}</h3>
                  <p className={styles.cardDesc}>{rom.descricao}</p>
                  <div className={styles.cardMeta}>
                    <span className={styles.cardPrice}>
                      R$ {rom.preco?.toFixed(2)}
                    </span>
                    <span className={styles.cardBadge}>Avulso</span>
                  </div>
                  <button
                    className={styles.btnBuy}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectItem('rom', rom);
                    }}
                  >
                    Comprar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modal */}
      {selectedItem && !pixData && (
        <div className={styles.overlay} onClick={handleCloseModals}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            {selectedItem.data.capaRef ? (
              <img
                src={selectedItem.data.capaRef}
                alt={selectedItem.data.titulo}
                className={styles.modalCover}
              />
            ) : (
              <div className={styles.modalCoverPlaceholder}>🎮</div>
            )}
            <div className={styles.modalBody}>
              <h2 className={styles.modalTitle}>{selectedItem.data.titulo}</h2>
              <p className={styles.modalDesc}>{selectedItem.data.descricao}</p>
              <div className={styles.modalInfo}>
                <div className={styles.modalInfoItem}>
                  <span className={styles.modalInfoLabel}>Preço</span>
                  <span className={styles.modalInfoValue}>
                    R$ {selectedItem.data.preco?.toFixed(2)}
                  </span>
                </div>
                <div className={styles.modalInfoItem}>
                  <span className={styles.modalInfoLabel}>Acesso</span>
                  <span className={styles.modalInfoValue}>Vitalício</span>
                </div>
                <div className={styles.modalInfoItem}>
                  <span className={styles.modalInfoLabel}>Pagamento</span>
                  <span className={styles.modalInfoValue}>PIX</span>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button
                  className={styles.btnCancel}
                  onClick={handleCloseModals}
                >
                  Cancelar
                </button>
                <button
                  className={styles.btnConfirm}
                  onClick={handleBuy}
                  disabled={buying}
                >
                  {buying ? 'Gerando PIX...' : 'Pagar com PIX'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PIX Modal */}
      {pixData && selectedItem && (
        <PixModal
          itemName={selectedItem.data.titulo}
          pixData={pixData}
          onClose={handleCloseModals}
          onPaymentConfirmed={handlePaymentConfirmed}
        />
      )}

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} · Prego Games</p>
      </footer>
    </main>
  );
}

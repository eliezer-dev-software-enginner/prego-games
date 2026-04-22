// app/packs/page.tsx
'use client';

import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';
import { Pack } from '../admin/packs/page';
import PixModal from '../components/PixModal/PixModal';
import { auth } from '../config/firebase';
import { setSEOMetadata } from '../lib/common';
import styles from './page.module.css';

interface PixData {
  success: boolean;
  paymentId?: string;
  qrCodeBase64?: string | null;
  qrCode?: string | null;
  status?: string;
  error?: string;
}

function SkeletonCard() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.skeletonCover} />
      <div className={styles.skeletonBody}>
        <div className={`${styles.skeletonLine} ${styles.medium}`} />
        <div className={`${styles.skeletonLine} ${styles.long}`} />
        <div className={`${styles.skeletonLine} ${styles.short}`} />
      </div>
    </div>
  );
}

export default function Page() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [ownedIds, setOwnedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);

  const [pixData, setPixData] = useState<PixData | null>(null);
  const [buying, setBuying] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);

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
    fetchPacks();
    checkIfAdmin();
    fetchOwned();
  }, [user]);

  useEffect(() => {
    setSEOMetadata({
      title: 'Prego Games - Packs de Jogos Retro',
      description:
        'Compre packs completos de jogos retro com acesso vitalício.',
      url: 'https://pregogames.com/packs',
      image: 'https://pregogames.com/og-packs.png',
      keywords:
        'packs de jogos, jogos retro, coleções, mega pack, nintendo, snes',
    });
  }, []);

  async function checkIfAdmin() {
    const res = await fetch('/api/admin');
    setIsAdmin(res.status === 200);
  }

  async function fetchPacks() {
    try {
      const res = await fetch('/api/packs');
      const data = await res.json();
      setPacks(data);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOwned() {
    const res = await fetch('/api/user/packs');
    const data = await res.json();
    setOwnedIds(data.map((p: { packId: string }) => p.packId));
  }

  function handleSelectPack(pack: Pack) {
    setSelectedPack(pack);
    setPixData(null);
  }

  async function handleBuy() {
    if (!selectedPack) return;
    setBuying(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId: selectedPack.id }),
      });

      const data: PixData = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? 'Erro ao gerar pagamento');
      }

      setPixData(data);
    } catch (e: any) {
      alert(e.message);
      setSelectedPack(null);
    } finally {
      setBuying(false);
    }
  }

  async function handlePaymentConfirmed() {
    setPixData(null);
    setSelectedPack(null);
    await fetchOwned();
  }

  function handleCloseModals() {
    setPixData(null);
    setSelectedPack(null);
  }

  async function handleLogout() {
    await signOut(auth);
    router.push('/auth');
  }

  return (
    <div className={styles.root}>
      {/* Header */}
      <header className={styles.header}>
        <a href='/home' className={styles.logo}>
          Prego<span className={styles.logoAccent}>.</span>Games
        </a>
        <div className={styles.headerRight}>
          {user && (
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
          )}
          <button className={styles.btnLogout} onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>

      {/* Page hero */}
      <div className={styles.pageHero}>
        <p className={styles.pageLabel}>Biblioteca</p>
        {isAdmin && (
          <div>
            <button onClick={() => router.push('admin/packs')}>
              Ir para Packs/Admin
            </button>
            <button onClick={() => router.push('admin/roms')}>
              Ir para Roms/Admin
            </button>
          </div>
        )}
        <h1 className={styles.pageTitle}>Packs de jogos</h1>
        <p className={styles.pageDesc}>
          Escolha um pack e tenha acesso imediato à coleção completa de jogos.
        </p>
      </div>

      {/* Grid */}
      <div className={styles.container}>
        {loading ? (
          <div className={styles.loadingGrid}>
            {[...Array(3)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : packs.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🕹️</div>
            <p className={styles.emptyText}>
              Nenhum pack disponível no momento.
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {packs.map((pack) => {
              const owned = ownedIds.includes(pack.id);
              return (
                <div
                  key={pack.id}
                  className={styles.card}
                  onClick={() => owned && router.push(`/packs/${pack.id}`)}
                  style={{ cursor: owned ? 'pointer' : 'default' }}
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
                    <h2 className={styles.cardTitle}>{pack.titulo}</h2>
                    <p className={styles.cardDesc}>{pack.descricao}</p>
                    <div className={styles.cardFooter}>
                      <div className={styles.cardMeta}>
                        <span className={styles.cardCount}>
                          {pack.gamesIds?.length ?? 0} jogos
                        </span>
                        {owned && (
                          <span className={styles.cardOwned}>✓ Adquirido</span>
                        )}
                      </div>
                      {owned ? (
                        <span
                          className={styles.btnOwned}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/packs/${pack.id}`);
                          }}
                        >
                          Ver jogos →
                        </span>
                      ) : (
                        <button
                          className={styles.btnBuy}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectPack(pack);
                          }}
                        >
                          Comprar pack
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de confirmação de compra */}
      {selectedPack && !pixData && (
        <div className={styles.overlay} onClick={handleCloseModals}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            {selectedPack.capaRef ? (
              <img
                src={selectedPack.capaRef}
                alt={selectedPack.titulo}
                className={styles.modalCover}
              />
            ) : (
              <div className={styles.modalCoverPlaceholder}>🎮</div>
            )}
            <div className={styles.modalBody}>
              <h2 className={styles.modalTitle}>{selectedPack.titulo}</h2>
              <p className={styles.modalDesc}>{selectedPack.descricao}</p>
              <div className={styles.modalInfo}>
                <div className={styles.modalInfoItem}>
                  <span className={styles.modalInfoLabel}>Jogos incluídos</span>
                  <span className={styles.modalInfoValue}>
                    {selectedPack.gamesIds?.length ?? 0}
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

      {/* Modal do PIX com QR Code */}
      {pixData && selectedPack && (
        <PixModal
          itemName={selectedPack.titulo}
          pixData={pixData}
          onClose={handleCloseModals}
          onPaymentConfirmed={handlePaymentConfirmed}
        />
      )}
    </div>
  );
}

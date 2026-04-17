// app/roms/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import PixModal from '@/app/components/PixModal/PixModal';

// Firebase client-side auth
import { auth } from '@/app/config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

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
  const [roms, setRoms] = useState<Rom[]>([]);
  const [selectedRom, setSelectedRom] = useState<Rom | null>(null);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [buying, setBuying] = useState(false);
  const [ownedRomIds, setOwnedRomIds] = useState<string[]>([]);

  // Authentication check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        router.push('/auth/login');
      }
    });
    return unsubscribe;
  }, [router]);

  // Fetch owned ROMs for the user
  async function fetchOwnedRomIds() {
    if (!user) return;
    try {
      const res = await fetch('/api/user/roms');
      const data = await res.json();
      setOwnedRomIds(data.map((r: { romId: string }) => r.romId));
    } catch (error) {
      console.error('Error fetching owned ROMs:', error);
    }
  }

  // Fetch all ROMs
  async function fetchRoms() {
    try {
      const res = await fetch('/api/roms');
      const data = await res.json();
      setRoms(data);
    } catch (error) {
      console.error('Error fetching ROMs:', error);
    }
  }

  useEffect(() => {
    if (user) {
      fetchRoms();
      fetchOwnedRomIds();
    }
  }, [user]);

  useEffect(() => {
    document.title = 'Prego Games - Jogos Avulsos Retro';

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', 'Prego Games - Jogos Avulsos Retro');

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute('content', 'Compre jogos avulsos retro com acesso vitalício.');

    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', 'https://pregogames.com/roms');

    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
      ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      document.head.appendChild(ogImage);
    }
    ogImage.setAttribute('content', 'https://pregogames.com/og-roms.png');

    let twitterCard = document.querySelector('meta[name="twitter:card"]');
    if (!twitterCard) {
      twitterCard = document.createElement('meta');
      twitterCard.setAttribute('name', 'twitter:card');
      document.head.appendChild(twitterCard);
    }
    twitterCard.setAttribute('content', 'summary_large_image');

    let twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (!twitterTitle) {
      twitterTitle = document.createElement('meta');
      twitterTitle.setAttribute('name', 'twitter:title');
      document.head.appendChild(twitterTitle);
    }
    twitterTitle.setAttribute('content', 'Prego Games - Jogos Avulsos Retro');

    let twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (!twitterDesc) {
      twitterDesc = document.createElement('meta');
      twitterDesc.setAttribute('name', 'twitter:description');
      document.head.appendChild(twitterDesc);
    }
    twitterDesc.setAttribute('content', 'Compre jogos avulsos retro com acesso vitalício.');
  }, []);

  function handleSelectRom(rom: Rom) {
    setSelectedRom(rom);
    setPixData(null);
  }

  async function handleBuyRom() {
    if (!selectedRom || !user) return;
    setBuying(true);
    try {
      const res = await fetch('/api/checkout/rom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ romId: selectedRom.id }),
      });

      const data: PixData = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? 'Erro ao gerar pagamento');
      }

      setPixData(data);
    } catch (e: any) {
      alert(e.message);
      setSelectedRom(null);
    } finally {
      setBuying(false);
    }
  }

  async function handlePaymentConfirmed() {
    setPixData(null);
    setSelectedRom(null);
    await fetchOwnedRomIds();
  }

  function handleCloseModals() {
    setPixData(null);
    setSelectedRom(null);
  }

  if (!user) {
    // This should be caught by the auth effect, but just in case
    return null;
  }

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
        <p className={styles.heroCount}>
          Compre jogos avulsos ou adquira packs completos
        </p>
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
            {roms.map((rom) => {
              const owned = ownedRomIds.includes(rom.id);
              return (
                <div key={rom.id} className={styles.card}>
                  <div className={styles.coverWrapper}>
                    {rom.capaRef ? (
                      <img
                        src={rom.capaRef}
                        alt={rom.titulo}
                        className={styles.cardCover}
                      />
                    ) : (
                      <div className={styles.coverPlaceholder}>🕹️</div>
                    )}
                  </div>
                  <div className={styles.cardBody}>
                    <h2 className={styles.cardTitle}>{rom.titulo}</h2>
                    <p className={styles.cardDesc}>{rom.descricao}</p>
                    <p className={styles.cardPrice}>R$ {rom.preco?.toFixed(2)}</p>
                    {owned ? (
                      <span className={styles.btnOwned} onClick={(e) => {
                        e.stopPropagation();
                        alert('Você já possui este jogo!');
                      }}>
                        ✓ Adquirido
                      </span>
                    ) : (
                      <button
                        className={styles.btnBuy}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectRom(rom);
                        }}
                      >
                        Comprar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de confirmação de compra */}
      {selectedRom && !pixData && (
        <div className={styles.overlay} onClick={handleCloseModals}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            {selectedRom.capaRef ? (
              <img
                src={selectedRom.capaRef}
                alt={selectedRom.titulo}
                className={styles.modalCover}
              />
            ) : (
              <div className={styles.modalCoverPlaceholder}>🕹️</div>
            )}
            <div className={styles.modalBody}>
              <h2 className={styles.modalTitle}>{selectedRom.titulo}</h2>
              <p className={styles.modalDesc}>{selectedRom.descricao}</p>
              <div className={styles.modalInfo}>
                <div className={styles.modalInfoItem}>
                  <span className={styles.modalInfoLabel}>Preço</span>
                  <span className={styles.modalInfoValue}>
                    R$ {selectedRom.preco?.toFixed(2)}
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
                  onClick={handleBuyRom}
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
      {pixData && selectedRom && (
        <PixModal
          itemName={selectedRom.titulo}
          pixData={pixData}
          onClose={handleCloseModals}
          onPaymentConfirmed={handlePaymentConfirmed}
        />
      )}
    </div>
  );
}
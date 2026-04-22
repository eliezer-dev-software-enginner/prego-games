// app/roms/page.tsx
'use client';

import { User, onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';

import Link from 'next/link';
import PixModal from '../components/PixModal/PixModal';
import { auth } from '../config/firebase';
import { setSEOMetadata } from '../lib/common';
import { Rom } from '../types/rom.type';
import styles from './page.module.css';
// Firebase client-side auth
import { useRouter } from 'next/navigation';

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
    setSEOMetadata({
      title: 'Prego Games - Jogos Avulsos Retro',
      description: 'Compre jogos avulsos retro com acesso vitalício.',
      url: 'https://pregogames.com/roms',
      image: 'https://pregogames.com/og-roms.png',
      keywords: 'jogos avulsos, roms individuais, jogos retro, compra de jogos',
    });
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
        <Link href='/home' className={styles.logo}>
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
                    <p className={styles.cardPrice}>
                      R$ {rom.preco?.toFixed(2)}
                    </p>
                    {owned ? (
                      <span
                        className={styles.btnOwned}
                        onClick={(e) => {
                          e.stopPropagation();
                          alert('Você já possui este jogo!');
                        }}
                      >
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

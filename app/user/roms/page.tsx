// app/user/roms/page.tsx
'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';
import { useRouter } from 'next/navigation';

interface Rom {
  id: string;
  titulo: string;
  descricao: string;
  capaRef: string;
  pathRef: string;
  preco: number;
}

export default function Page() {
  const router = useRouter();
  const [roms, setRoms] = useState<Rom[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchUserRomss() {
    try {
      const res = await fetch('/api/user/roms');
      const data = await res.json();
      const romIds = data.map((item: { romId: string }) => item.romId);
      
      // Fetch full details for each ROM
      const romPromises = romIds.map(async (id: string) => {
        const res = await fetch(`/api/roms`);
        const allRoms = await res.json();
        return allRoms.find((rom: Rom) => rom.id === id);
      });
      
      const romDetails = await Promise.all(romPromises);
      setRoms(romDetails.filter((rom): rom is Rom => rom !== undefined));
    } catch (error) {
      console.error('Error fetching user ROMs:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUserRomss();
  }, []);

  if (loading) {
    return (
      <div className={styles.root}>
        <div className={styles.loading}>
          Carregando seus jogos...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <a href='/' className={styles.logo}>
          Prego<span className={styles.logoAccent}>.</span>Games
        </a>
        <a href='/packs' className={styles.btnBack}>
          ← Voltar aos Packs
        </a>
      </header>

      <div className={styles.hero}>
        <p className={styles.heroLabel}>Meus Jogos</p>
        <h1 className={styles.heroTitle}>Jogos comprados</h1>
        {roms.length === 0 ? (
          <p className={styles.heroCount}>
            Você ainda não comprou nenhum jogo avulso.
          </p>
        ) : (
          <p className={styles.heroCount}>
            {roms.length} jogo{roms.length !== 1 ? 's' : ''} disponível{roms.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {roms.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🎮</div>
          <p className={styles.emptyText}>
            Nenhum jogo comprado ainda. Visite a loja para comprar jogos avulsos ou packs.
          </p>
          <div className={styles.emptyActions}>
            <a href='/roms' className={styles.btnShop}>
              Ver jogos disponíveis
            </a>
            <a href='/packs' className={styles.btnShop}>
              Ver packs disponíveis
            </a>
          </div>
        </div>
      ) : (
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Sua coleção</h2>
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
                    <div className={styles.coverPlaceholder}>🕹️</div>
                  )}
                </div>
                <div className={styles.cardBody}>
                  <h2 className={styles.cardTitle}>{rom.titulo}</h2>
                  <p className={styles.cardDesc}>{rom.descricao}</p>
                  <div className={styles.cardFooter}>
                    <a
                      href={rom.pathRef}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.btnDownload}
                    >
                      ↓ Download
                    </a>
                    <span className={styles.purchaseDate}>
                      Comprado em: {new Date().toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
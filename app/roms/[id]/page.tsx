'use client';
// app/roms/[id]/page.tsx

import { User, onAuthStateChanged } from 'firebase/auth';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import Link from 'next/link';
import { auth } from '../../config/firebase';
import { Rom } from '../../types/rom.type';
import styles from './page.module.css';

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [rom, setRom] = useState<Rom | null>(null);
  const [owned, setOwned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push('/auth/login');
        return;
      }
      setUser(u);
    });
    return unsubscribe;
  }, [router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([fetchRom(), fetchOwned()]).finally(() => setLoading(false));
  }, [user]);

  async function fetchRom() {
    const res = await fetch(`/api/roms/${id}`);
    if (!res.ok) {
      router.push('/roms');
      //router.push(`/roms?comprar=${id}`);
      return;
    }
    const data = await res.json();
    setRom(data);
  }

  async function fetchOwned() {
    const res = await fetch('/api/user/roms');
    const data = await res.json();
    const ids = data.map((r: { romId: string }) => r.romId);
    setOwned(ids.includes(id));
  }

  async function handleDownload() {
    if (!owned) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/download/rom?id=${id}`);
      if (!res.ok) throw new Error('Erro ao baixar');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = rom?.titulo ?? 'rom';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDownloading(false);
    }
  }

  if (loading || !user) {
    return (
      <div className={styles.root}>
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  if (!rom) return null;

  const idioma = rom.dublado
    ? 'Dublado'
    : rom.traduzido
      ? 'Traduzido PT-BR'
      : 'Original';

  return (
    <div className={styles.root}>
      {/* Header */}
      <header className={styles.header}>
        <Link href='/roms' className={styles.back}>
          ← Voltar
        </Link>
        <Link href='/home' className={styles.logo}>
          Prego<span className={styles.logoAccent}>.</span>Games
        </Link>
        <div className={styles.headerSpacer} />
      </header>

      <div className={styles.page}>
        {/* Capa + info lado a lado */}
        <div className={styles.hero}>
          <div className={styles.coverWrap}>
            {rom.capaRef ? (
              <img
                src={rom.capaRef}
                alt={rom.titulo}
                className={styles.cover}
              />
            ) : (
              <div className={styles.coverPlaceholder}>🕹️</div>
            )}
            {/* brilho refletido abaixo da capa */}
            {rom.capaRef && (
              <div
                className={styles.coverReflection}
                style={{ backgroundImage: `url(${rom.capaRef})` }}
              />
            )}
          </div>

          <div className={styles.info}>
            {/* badges */}
            <div className={styles.badges}>
              {rom.type && (
                <span className={`${styles.badge} ${styles.badgeType}`}>
                  {rom.type}
                </span>
              )}
              {rom.traduzido && (
                <span className={`${styles.badge} ${styles.badgeLeg}`}>
                  LEG
                </span>
              )}
              {rom.dublado && (
                <span className={`${styles.badge} ${styles.badgeDub}`}>
                  DUB
                </span>
              )}
            </div>

            <h1 className={styles.title}>{rom.titulo}</h1>

            {rom.descricao && <p className={styles.desc}>{rom.descricao}</p>}

            {/* ficha técnica */}
            <div className={styles.meta}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Plataforma</span>
                <span className={styles.metaValue}>{rom.type}</span>
              </div>
              <div className={styles.metaDivider} />
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Idioma</span>
                <span className={styles.metaValue}>{idioma}</span>
              </div>
              <div className={styles.metaDivider} />
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Acesso</span>
                <span className={styles.metaValue}>Vitalício</span>
              </div>
              {!owned && (
                <>
                  <div className={styles.metaDivider} />
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Preço</span>
                    <span className={`${styles.metaValue} ${styles.accent}`}>
                      R$ {rom.preco?.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* ação principal */}
            {owned ? (
              <button
                className={styles.btnDownload}
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <>
                    <span className={styles.btnSpinner} />
                    Baixando...
                  </>
                ) : (
                  <>
                    <span className={styles.btnIcon}>↓</span>
                    Baixar ROM
                  </>
                )}
              </button>
            ) : (
              <div className={styles.notOwned}>
                <p className={styles.notOwnedText}>
                  Você ainda não possui este jogo.
                </p>
                <button
                  className={styles.btnBuy}
                  onClick={() => router.push(`/roms?comprar=${id}`)}
                >
                  Comprar por R$ {rom.preco?.toFixed(2)}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

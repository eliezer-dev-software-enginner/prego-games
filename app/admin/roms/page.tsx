'use client';

import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { useEffect, useState } from 'react';

import { storage } from '@/app/config/firebase';
import Link from 'next/link';
import styles from './page.module.css';

export type Rom = {
  id: string;
  titulo: string;
  descricao: string;
  pathRef: string;
  capaRef: string;
};

export default function Page() {
  const [roms, setRoms] = useState<Rom[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [romFile, setRomFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [coverProgress, setCoverProgress] = useState<number | null>(null);
  const [romProgress, setRomProgress] = useState<number | null>(null);

  useEffect(() => {
    fetchRoms();
  }, []);

  async function fetchRoms() {
    const res = await fetch('/api/roms');
    const data = await res.json();
    setRoms(data);
  }

  function handleEdit(rom: Rom) {
    setEditingId(rom.id);
    setTitle(rom.titulo);
    setDescription(rom.descricao);
    setCoverFile(null);
    setRomFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleClear() {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setCoverFile(null);
    setRomFile(null);
    setCoverProgress(null);
    setRomProgress(null);
  }

  function uploadFile(
    file: File,
    path: string,
    onProgress: (pct: number) => void,
  ): Promise<string> {
    const metadata = {
      contentDisposition: `attachment; filename="${file.name}"`,
    };

    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const task = uploadBytesResumable(storageRef, file, metadata);
      task.on(
        'state_changed',
        (snap) =>
          onProgress(
            Math.round((snap.bytesTransferred / snap.totalBytes) * 100),
          ),
        reject,
        async () => resolve(await getDownloadURL(task.snapshot.ref)),
      );
    });
  }

  async function handleSaveUpdate() {
    if (!title || !description) return alert('Preencha título e descrição');
    if (!editingId && (!coverFile || !romFile))
      return alert('Selecione a capa e o arquivo do jogo');

    try {
      setLoading(true);

      let capaRef = editingId
        ? roms.find((r) => r.id === editingId)?.capaRef
        : '';
      let pathRef = editingId
        ? roms.find((r) => r.id === editingId)?.pathRef
        : '';

      if (coverFile)
        capaRef = await uploadFile(
          coverFile,
          `roms/covers/${title}`,
          setCoverProgress,
        );
      if (romFile)
        pathRef = await uploadFile(
          romFile,
          `roms/files/${title}`,
          setRomProgress,
        );

      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/roms/${editingId}` : '/api/roms';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: title,
          descricao: description,
          capaRef: capaRef,
          pathRef: pathRef,
        }),
      });

      if (!res.ok) throw new Error('Erro ao salvar');
      handleClear();
      await fetchRoms();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja excluir este jogo?')) return;
    try {
      const res = await fetch(`/api/roms/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir');
      await fetchRoms();
    } catch (e: any) {
      alert(e.message);
    }
  }

  const showProgress =
    loading && (coverProgress !== null || romProgress !== null);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <Link href='/' className={styles.logo}>
          Prego<span className={styles.logoAccent}>.</span>Games
        </Link>
        <span className={styles.adminBadge}>Admin</span>
      </header>

      <div className={styles.layout}>
        {/* Formulário */}
        <div className={styles.formPanel}>
          <h2 className={styles.formTitle}>
            {editingId ? 'Atualizar jogo' : 'Novo jogo'}
          </h2>

          <div className={styles.formFields}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor='title'>
                Título
              </label>
              <input
                id='title'
                className={styles.input}
                autoComplete='off'
                placeholder='Ex: Super Mario World'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor='description'>
                Descrição
              </label>
              <input
                id='description'
                className={styles.input}
                autoComplete='off'
                placeholder='Breve descrição do jogo'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor='cover'>
                Capa do jogo
              </label>
              <input
                id='cover'
                type='file'
                accept='image/*'
                className={styles.fileInput}
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor='rom'>
                Arquivo do jogo
              </label>
              <input
                id='rom'
                type='file'
                className={styles.fileInput}
                onChange={(e) => setRomFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          {/* Progress bars */}
          {showProgress && (
            <div className={styles.progressWrapper}>
              {coverProgress !== null && (
                <div className={styles.progressItem}>
                  <div className={styles.progressLabel}>
                    <span>Capa</span>
                    <span className={styles.progressPct}>{coverProgress}%</span>
                  </div>
                  <div className={styles.progressTrack}>
                    <div
                      className={`${styles.progressBar} ${coverProgress === 100 ? styles.done : styles.uploading}`}
                      style={{ width: `${coverProgress}%` }}
                    />
                  </div>
                </div>
              )}
              {romProgress !== null && (
                <div className={styles.progressItem}>
                  <div className={styles.progressLabel}>
                    <span>Arquivo</span>
                    <span className={styles.progressPct}>{romProgress}%</span>
                  </div>
                  <div className={styles.progressTrack}>
                    <div
                      className={`${styles.progressBar} ${romProgress === 100 ? styles.done : styles.uploading}`}
                      style={{ width: `${romProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={styles.formActions}>
            <button
              className={styles.btnSave}
              onClick={handleSaveUpdate}
              disabled={loading}
            >
              {loading
                ? 'Salvando...'
                : editingId
                  ? 'Atualizar'
                  : 'Salvar jogo'}
            </button>
            {editingId && (
              <button className={styles.btnCancel} onClick={handleClear}>
                Cancelar
              </button>
            )}
          </div>
        </div>

        {/* Lista de jogos */}
        <div className={styles.listPanel}>
          <div className={styles.listHeader}>
            <h1 className={styles.listTitle}>Jogos</h1>
            <span className={styles.listCount}>
              {roms.length} cadastrado{roms.length !== 1 ? 's' : ''}
            </span>
          </div>

          {roms.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🕹️</div>
              <p className={styles.emptyText}>Nenhum jogo cadastrado ainda.</p>
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
                        className={styles.cover}
                      />
                    ) : (
                      <div className={styles.coverPlaceholder}>🎮</div>
                    )}
                  </div>
                  <div className={styles.cardBody}>
                    <h3 className={styles.cardTitle}>{rom.titulo}</h3>
                    <p className={styles.cardDesc}>{rom.descricao}</p>
                    <div className={styles.cardActions}>
                      <button
                        className={styles.btnEdit}
                        onClick={() => handleEdit(rom)}
                      >
                        Editar
                      </button>
                      <button
                        className={styles.btnDelete}
                        onClick={() => handleDelete(rom.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

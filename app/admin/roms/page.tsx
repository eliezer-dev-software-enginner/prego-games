'use client';
//app/admin/roms/page.tsx

import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { useEffect, useState } from 'react';
import { Rom, RomType } from '../../types/rom.type';

import HeaderLogo from '../../components/HeaderLogo';
import { storage } from '../../config/firebase';
import styles from './page.module.css';

const ROM_TYPES: RomType[] = ['PS2', 'SNES', 'GBA'];

export default function Page() {
  const [roms, setRoms] = useState<Rom[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [type, setType] = useState<RomType>('SNES');
  const [traduzido, setTraduzido] = useState(false);
  const [dublado, setDublado] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [romFile, setRomFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [coverProgress, setCoverProgress] = useState<number | null>(null);
  const [romProgress, setRomProgress] = useState<number | null>(null);

  const [loteFile, setLoteFile] = useState<File | null>(null);
  const [lotePreview, setLotePreview] = useState<
    { name: string; type?: string }[] | null
  >(null);
  const [loteLoading, setLoteLoading] = useState(false);

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
    setPrice(rom.preco?.toString() ?? '');
    setType(rom.type ?? 'SNES');
    setTraduzido(rom.traduzido ?? false);
    setDublado(rom.dublado ?? false);
    setCoverFile(null);
    setRomFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleClear() {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setPrice('0');
    setType('SNES');
    setTraduzido(false);
    setDublado(false);
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
    if (!title) return alert('Preencha título');
    if (!price) return alert('Preencha o preço');
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
          capaRef,
          pathRef,
          preco: parseFloat(price),
          type,
          traduzido,
          dublado,
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

  function handleLoteFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setLoteFile(file);
    setLotePreview(null);

    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(parsed)) throw new Error();
        setLotePreview(
          parsed.map((r: any) => ({ name: r.name, type: r.type })),
        );
      } catch {
        alert('JSON inválido. Esperado um array de ROMs.');
        setLoteFile(null);
      }
    };
    reader.readAsText(file);
  }

  async function handleLoteImport() {
    if (!loteFile) return;

    try {
      setLoteLoading(true);
      const text = await loteFile.text();
      const body = JSON.parse(text);

      const res = await fetch('/api/roms/lote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Erro ao importar lote');
      const { message } = await res.json();
      alert(message);
      setLoteFile(null);
      setLotePreview(null);
      await fetchRoms();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoteLoading(false);
    }
  }

  return (
    <div className={styles.root}>
      <HeaderLogo />

      <div className={styles.layout}>
        {/* Importar lote */}
        <div className={styles.lotePanel}>
          <h2 className={styles.formTitle}>Importar lote (JSON)</h2>

          <label className={styles.loteDropzone} htmlFor='lote-input'>
            <span className={styles.loteIcon}>📦</span>
            <span className={styles.loteLabel}>
              {loteFile ? loteFile.name : 'Selecionar arquivo .json'}
            </span>
            <input
              id='lote-input'
              type='file'
              accept='.json,application/json'
              className={styles.loteInput}
              onChange={handleLoteFileChange}
            />
          </label>

          {lotePreview && (
            <div className={styles.lotePreview}>
              <p className={styles.lotePreviewCount}>
                {lotePreview.length} jogo{lotePreview.length !== 1 ? 's' : ''}{' '}
                encontrado{lotePreview.length !== 1 ? 's' : ''}
              </p>
              <ul className={styles.loteList}>
                {lotePreview.slice(0, 5).map((r, i) => (
                  <li key={i} className={styles.loteListItem}>
                    <span className={styles.loteListName}>{r.name}</span>
                    {r.type && (
                      <span className={styles.typeBadge}>{r.type}</span>
                    )}
                  </li>
                ))}
                {lotePreview.length > 5 && (
                  <li className={styles.loteListMore}>
                    +{lotePreview.length - 5} mais...
                  </li>
                )}
              </ul>
            </div>
          )}

          <button
            className={styles.btnSave}
            onClick={handleLoteImport}
            disabled={!loteFile || loteLoading}
          >
            {loteLoading ? 'Importando...' : 'Importar lote'}
          </button>
        </div>

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
              <label className={styles.label} htmlFor='price'>
                Preço (R$)
              </label>
              <input
                id='price'
                type='number'
                step='0.01'
                min='0'
                className={styles.input}
                autoComplete='off'
                placeholder='Ex: 9.90'
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor='type'>
                Tipo / Plataforma
              </label>
              <select
                id='type'
                className={styles.input}
                value={type}
                onChange={(e) => setType(e.target.value as RomType)}
              >
                {ROM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Checkboxes legendado / dublado */}
            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type='checkbox'
                  className={styles.checkbox}
                  checked={traduzido}
                  onChange={(e) => setTraduzido(e.target.checked)}
                />
                Legendado
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type='checkbox'
                  className={styles.checkbox}
                  checked={dublado}
                  onChange={(e) => setDublado(e.target.checked)}
                />
                Dublado
              </label>
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
                    <div className={styles.cardMeta}>
                      {rom.type && (
                        <span className={styles.typeBadge}>{rom.type}</span>
                      )}
                      {rom.traduzido && (
                        <span className={styles.metaBadge}>Leg</span>
                      )}
                      {rom.dublado && (
                        <span className={styles.metaBadge}>Dub</span>
                      )}
                      <p className={styles.cardPrice}>
                        R$ {rom.preco?.toFixed(2)}
                      </p>
                    </div>
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

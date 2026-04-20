//app/admin/packs/page.tsx

'use client';

import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useEffect, useState } from 'react';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '../../../components/ui/field';

import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { storage } from '../../config/firebase';
import { Rom } from '../roms/page';
import s from './page.module.css';

export type Pack = {
  id: string;
  titulo: string;
  descricao: string;
  gamesIds: string[];
  capaRef: string;
  preco: number;
};

export default function Page() {
  const [roms, setRoms] = useState<Rom[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [title, setTitle] = useState('Lorem Ipsum');
  const [price, setPrice] = useState('10');
  const [description, setDescription] = useState(
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur dictum est ut ultrices aliquam. Etiam ultrices nibh quis fermentum facilisis. Morbi tincidunt faucibus placerat. Morbi fermentum commodo leo, non egestas lorem sagittis eget. Nulla eget turpis hendrerit, pulvinar orci sit amet, eleifend eros. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed at nunc non nibh blandit semper at eu diam.',
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [gamesIds, setGamesIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRoms();
    fetchPacks();
  }, []);

  async function fetchRoms() {
    const res = await fetch('/api/roms');
    const data = await res.json();
    setRoms(data);
  }

  async function fetchPacks() {
    const res = await fetch('/api/packs');
    const data = await res.json();
    setPacks(data);
  }

  function handleSelect(id: string) {
    setGamesIds((prev) => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  }

  function handleUnselect(id: string) {
    setGamesIds((prev) => prev.filter((v) => v !== id));
  }

  function handleToggle(id: string) {
    setGamesIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  }

  function handleClear() {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setCoverFile(null);
    setGamesIds([]);
  }

  async function uploadFile(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  }

  async function handleSaveUpdate() {
    if (!title || !description) return alert('Preencha título e descrição');
    if (!editingId && !coverFile) return alert('Selecione a capa');

    try {
      setLoading(true);

      let capaRef = editingId
        ? packs.find((r) => r.id === editingId)?.capaRef
        : '';

      if (coverFile) {
        capaRef = await uploadFile(coverFile, `packs/covers/${title}`);
      }

      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/packs/${editingId}` : '/api/packs';

      const payload: Pack = {
        id: editingId ?? '',
        titulo: title,
        descricao: description,
        capaRef: capaRef ?? '',
        gamesIds,
        preco: Number(price),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Erro ao salvar');

      handleClear();
      await fetchPacks();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(pack: Pack) {
    setEditingId(pack.id);
    setTitle(pack.titulo);
    setDescription(pack.descricao);
    setGamesIds(pack.gamesIds ?? []);
    setCoverFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja excluir este pack?')) return;
    try {
      const res = await fetch(`/api/packs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir');
      await fetchPacks();
    } catch (e: any) {
      alert(e.message);
    }
  }

  const selectedRoms = roms.filter((r) => gamesIds.includes(r.id));
  const unselectedRoms = roms.filter((r) => !gamesIds.includes(r.id));

  return (
    <div
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '32px 16px',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Formulário */}
      <div className={s.form_container}>
        <FieldSet>
          <FieldLegend
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#fff',
              marginBottom: '20px',
            }}
          >
            {editingId ? '✏️ Atualizar pack' : '➕ Criar pack'}
          </FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor='title'>Título</FieldLabel>
              <Input
                id='title'
                autoComplete='off'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor='description'>Descrição</FieldLabel>
              <Input
                id='description'
                autoComplete='off'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor='price'>Preço</FieldLabel>
              <Input
                id='price'
                autoComplete='off'
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor='cover'>Capa do pack</FieldLabel>
              <Input
                id='cover'
                type='file'
                accept='image/*'
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              />
            </Field>

            {/* Jogos selecionados */}
            {gamesIds.length > 0 && (
              <div>
                <p
                  style={{
                    fontSize: '13px',
                    color: '#a1a1aa',
                    marginBottom: '10px',
                  }}
                >
                  {gamesIds.length} jogo(s) no pack
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedRoms.map((rom) => (
                    <div
                      key={rom.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#22c55e22',
                        border: '1px solid #22c55e66',
                        borderRadius: '8px',
                        padding: '4px 10px 4px 6px',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleUnselect(rom.id)}
                      title='Clique para remover'
                    >
                      {rom.capaRef && (
                        <img
                          src={rom.capaRef}
                          alt={rom.titulo}
                          width={24}
                          height={24}
                          style={{ borderRadius: '4px', objectFit: 'cover' }}
                        />
                      )}
                      <span style={{ fontSize: '13px', color: '#22c55e' }}>
                        {rom.titulo}
                      </span>
                      <span style={{ fontSize: '11px', color: '#22c55e99' }}>
                        ✕
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <Button onClick={handleSaveUpdate} disabled={loading}>
                {loading ? 'Salvando...' : editingId ? 'Atualizar' : 'Salvar'}
              </Button>
              {editingId && <Button onClick={handleClear}>Cancelar</Button>}
            </div>
          </FieldGroup>
        </FieldSet>
      </div>

      {/* Lista de packs */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px' }}>
          Packs
        </h2>
        {packs.length === 0 ? (
          <p style={{ color: '#71717a' }}>Nenhum pack criado ainda.</p>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px',
            }}
          >
            {packs.map((pack) => (
              <div
                key={pack.id}
                style={{
                  background: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '10px',
                  overflow: 'hidden',
                }}
              >
                {pack.capaRef && (
                  <img
                    src={pack.capaRef}
                    alt={pack.titulo}
                    width='100%'
                    height={120}
                    style={{ objectFit: 'cover', display: 'block' }}
                  />
                )}
                <div style={{ padding: '12px' }}>
                  <p style={{ fontWeight: 600, marginBottom: '4px' }}>
                    {pack.titulo}
                  </p>
                  <p
                    style={{
                      fontSize: '12px',
                      color: '#71717a',
                      marginBottom: '10px',
                    }}
                  >
                    {pack.gamesIds?.length ?? 0} jogos
                  </p>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Button onClick={() => handleEdit(pack)}>Editar</Button>
                    <Button onClick={() => handleDelete(pack.id)}>
                      Excluir
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Seleção de jogos */}
      <section>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>
          Jogos
        </h2>
        <p style={{ fontSize: '13px', color: '#71717a', marginBottom: '16px' }}>
          Clique para adicionar ou remover do pack
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '12px',
          }}
        >
          {roms.map((rom) => {
            const selected = gamesIds.includes(rom.id);
            return (
              <div
                key={rom.id}
                onClick={() => handleToggle(rom.id)}
                style={{
                  cursor: 'pointer',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: selected ? '2px solid #22c55e' : '2px solid #27272a',
                  background: selected ? '#22c55e11' : '#18181b',
                  transition: 'border-color 0.15s, background 0.15s',
                  position: 'relative',
                }}
              >
                {selected && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: '#22c55e',
                      borderRadius: '50%',
                      width: '22px',
                      height: '22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#000',
                      zIndex: 1,
                    }}
                  >
                    ✓
                  </div>
                )}
                {rom.capaRef ? (
                  <img
                    src={rom.capaRef}
                    alt={rom.titulo}
                    width='100%'
                    height={100}
                    style={{
                      objectFit: 'cover',
                      display: 'block',
                      opacity: selected ? 1 : 0.7,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      height: 100,
                      background: '#27272a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: '28px' }}>🎮</span>
                  </div>
                )}
                <div style={{ padding: '8px 10px' }}>
                  <p
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: selected ? '#22c55e' : '#e4e4e7',
                      margin: 0,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {rom.titulo}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

'use client';

import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useEffect, useState } from 'react';

import { storage } from '@/app/config/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type Rom = {
  id: string;
  titulo: string;
  descricao: string;
  'path-ref': string;
  'capa-ref': string;
};

export default function Page() {
  const [roms, setRoms] = useState<Rom[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [romFile, setRomFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRoms();
  }, []);

  async function fetchRoms() {
    const res = await fetch('/api/admin/roms');
    const data = await res.json();
    setRoms(data);
  }

  function handleEdit(rom: Rom) {
    setEditingId(rom.id);
    setTitle(rom.titulo);
    setDescription(rom.descricao);
    setCoverFile(null);
    setRomFile(null);
  }

  function handleClear() {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setCoverFile(null);
    setRomFile(null);
  }

  async function uploadFile(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  }

  async function handleSaveUpdate() {
    if (!title || !description) return alert('Preencha título e descrição');
    if (!editingId && (!coverFile || !romFile))
      return alert('Selecione a capa e o arquivo do jogo');

    try {
      setLoading(true);

      // faz upload dos arquivos se foram selecionados
      let capaRef = editingId
        ? roms.find((r) => r.id === editingId)?.['capa-ref']
        : '';
      let pathRef = editingId
        ? roms.find((r) => r.id === editingId)?.['path-ref']
        : '';

      if (coverFile) {
        capaRef = await uploadFile(coverFile, `roms/covers/${title}`);
      }

      if (romFile) {
        pathRef = await uploadFile(romFile, `roms/files/${title}`);
      }

      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? `/api/admin/roms/${editingId}`
        : '/api/admin/roms';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: title,
          descricao: description,
          'capa-ref': capaRef,
          'path-ref': pathRef,
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
      const res = await fetch(`/api/admin/roms/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir');
      await fetchRoms();
    } catch (e: any) {
      alert(e.message);
    }
  }

  return (
    <div>
      <FieldSet>
        <FieldLegend>{editingId ? 'Atualizar jogo' : 'Criar jogo'}</FieldLegend>
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
            <FieldLabel htmlFor='cover'>Capa do jogo</FieldLabel>
            <Input
              id='cover'
              type='file'
              accept='image/*'
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor='rom'>Arquivo do jogo</FieldLabel>
            <Input
              id='rom'
              type='file'
              onChange={(e) => setRomFile(e.target.files?.[0] ?? null)}
            />
          </Field>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button onClick={handleSaveUpdate} disabled={loading}>
              {loading ? 'Salvando...' : editingId ? 'Atualizar' : 'Salvar'}
            </Button>
            {editingId && <Button onClick={handleClear}>Cancelar</Button>}
          </div>
        </FieldGroup>
      </FieldSet>

      <hr />
      <h1>Jogos</h1>
      <ul>
        {roms.map((rom) => (
          <li
            key={rom.id}
            style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
          >
            {rom['capa-ref'] && (
              <img
                src={rom['capa-ref']}
                alt={rom.titulo}
                width={60}
                height={60}
                style={{ objectFit: 'cover', borderRadius: '4px' }}
              />
            )}
            <span>{rom.titulo}</span>
            <Button onClick={() => handleEdit(rom)}>Editar</Button>
            <Button onClick={() => handleDelete(rom.id)}>Excluir</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

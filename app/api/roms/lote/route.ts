// app/api/roms/lote/route.ts

import { NextResponse } from 'next/server';
import { verifyAdmin } from '../../../admin/_utils/utils';
import { adminDb } from '../../../config/firebase-admin';
import { Rom } from '../../../types/rom.type';
import { RomLoteType } from '../../../types/romLote.type';

export async function POST(req: Request) {
  const admin = await verifyAdmin();
  if (!admin)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body: RomLoteType[] = await req.json();

  await Promise.all(
    body.map((item) => {
      const rom: Omit<Rom, 'id'> = {
        dtMillis: Date.now(),
        vendas: 0,
        descricao: item.description,
        titulo: item.name,
        capaRef: item.capaUrl,
        dublado: false,
        traduzido: item.traduzido ?? false,
        preco: 7,
        type: item.type ?? 'GBA',
        pathRef: '',
      };
      return adminDb.collection('apps/prego-games/roms').add(rom);
    }),
  );

  return NextResponse.json(
    { message: `${body.length} roms adicionadas` },
    { status: 201 },
  );
}

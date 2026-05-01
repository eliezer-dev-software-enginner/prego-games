// app/api/roms/lote/route.ts

import { NextResponse } from "next/server";
import { verifyAdmin } from "../../../admin/_utils/utils";
import { adminDb } from "../../../config/firebase-admin";
import { encurtarUrl } from "../../../lib/encurta";
import { Rom } from "../../../types/rom.type";
import { RomLoteType } from "../../../types/romLote.type";

export async function POST(req: Request) {
  const admin = await verifyAdmin();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: RomLoteType[] = await req.json();

  await Promise.all(
    body.map(async (item) => {
      const rom: Omit<Rom, "id"> = {
        dtMillis: Date.now(),
        vendas: 0,
        descricao: item.description,
        titulo: item.name,
        capaRef: item.capaUrl,
        dublado: false,
        traduzido: item.traduzido ?? false,
        preco: 2.5,
        type: item.type ?? "GBA",
        pathRef: "",
      };

      // 1. Salva e obtém o doc ID
      const ref = await adminDb.collection("apps/prego-games/roms").add(rom);

      // 2. Encurta o pathRef se existir
      //    No lote, a maioria vem sem pathRef ainda — encurta só quando presente
      if (rom.pathRef) {
        const shortUrl = await encurtarUrl(rom.pathRef, ref.id);
        if (shortUrl) {
          await ref.update({ shortUrl });
        }
      }
    }),
  );

  return NextResponse.json(
    { message: `${body.length} roms adicionadas` },
    { status: 201 },
  );
}

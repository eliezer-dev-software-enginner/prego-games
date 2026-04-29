// app/api/roms/route.ts

import { NextResponse } from "next/server";
import { verifyAdmin } from "../../admin/_utils/utils";
import { adminDb } from "../../config/firebase-admin";
import { Rom } from "../../types/rom.type";
import { encurtarUrl } from "../../lib/encurta";

export async function GET() {
  // Allow anyone to fetch the list of ROMs (for display) but without the download URL
  const snapshot = await adminDb.collection("apps/prego-games/roms").get();
  const roms = snapshot.docs.map((doc) => {
    const data = doc.data();
    // Return only the fields needed for display (exclude pathRef for security)
    const { pathRef, ...rest } = data;
    return { id: doc.id, ...rest };
  });

  return NextResponse.json(roms);
}

export async function POST(req: Request) {
  const admin = await verifyAdmin();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: Rom = await req.json();
  body.dtMillis = Date.now();
  body.vendas = 0;

  // 1. Salva primeiro para obter o ID gerado pelo Firestore
  const ref = await adminDb.collection("apps/prego-games/roms").add(body);

  // 2. Encurta o pathRef usando o doc ID como alias (único e estável)
  //    Fazemos isso de forma não-bloqueante: se falhar, a ROM já está salva
  if (body.pathRef) {
    const shortUrl = await encurtarUrl(body.pathRef, ref.id);
    if (shortUrl) {
      await ref.update({ shortUrl });
    }
  }

  return NextResponse.json({ id: ref.id }, { status: 201 });
}

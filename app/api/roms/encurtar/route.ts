// app/api/roms/encurtar/route.ts

import { NextResponse } from "next/server";
import { verifyAdmin } from "../../../admin/_utils/utils";
import { adminDb } from "../../../config/firebase-admin";
import { encurtarUrl } from "../../../lib/shrinkearn";

export async function POST() {
  const admin = await verifyAdmin();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snapshot = await adminDb.collection("apps/prego-games/roms").get();

  // Filtra apenas ROMs que têm pathRef mas ainda não têm shortUrl
  const pendentes = snapshot.docs.filter((doc) => {
    const data = doc.data();
    return data.pathRef && !data.shortUrl;
  });

  if (pendentes.length === 0) {
    return NextResponse.json({
      message: "Nenhuma ROM pendente de encurtamento",
      total: 0,
      ok: 0,
      falha: 0,
    });
  }

  let ok = 0;
  let falha = 0;

  // Processa sequencialmente para não sobrecarregar a API do Shrinks
  for (const doc of pendentes) {
    const { pathRef } = doc.data();
    const shortUrl = await encurtarUrl(pathRef, doc.id);

    if (shortUrl) {
      await doc.ref.update({ shortUrl });
      ok++;
    } else {
      falha++;
    }

    // Pequena pausa entre requests para não bater rate limit
    await new Promise((r) => setTimeout(r, 300));
  }

  return NextResponse.json({
    message: `Encurtamento concluído: ${ok} ok, ${falha} falha(s)`,
    total: pendentes.length,
    ok,
    falha,
  });
}

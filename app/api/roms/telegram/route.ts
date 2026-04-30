// app/api/roms/telegram/route.ts

import { NextResponse } from "next/server";
import { verifyAdmin } from "../../../admin/_utils/utils";
import { adminDb } from "../../../config/firebase-admin";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID; // ex: "@seucanal" ou "-100123456789"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

async function enviarRomNoTelegram(rom: {
  id: string;
  titulo: string;
  descricao: string;
  capaRef: string;
  shortUrl: string;
  type: string;
  traduzido: boolean;
  dublado: boolean;
  preco: number;
}) {
  const idioma = rom.dublado
    ? "Dublado"
    : rom.traduzido
      ? "Legendado"
      : "Original";
  const precoFormatado = `R$ ${rom.preco?.toFixed(2)}`;
  const comprarUrl = `${SITE_URL}/roms/${rom.id}`;

  const MAX_DESC = 200;
  const descricaoTruncada =
    rom.descricao && rom.descricao.length > MAX_DESC
      ? rom.descricao.slice(0, MAX_DESC).trimEnd() + "…"
      : rom.descricao;

  const caption = [
    `🕹️ *${rom.titulo}*`,
    descricaoTruncada ? `\n${descricaoTruncada}` : "",
    `\n📦 Plataforma: *${rom.type}*`,
    `🌐 Idioma: *${idioma}*`,
    `💰 Preço: *${precoFormatado}*`,
  ]
    .filter(Boolean)
    .join("\n");

  const inline_keyboard = [
    [
      {
        text: "⚡ Baixar grátis (com anúncio)",
        url: rom.shortUrl,
      },
    ],
    [
      {
        text: "🛒 Comprar acesso vitalício",
        url: comprarUrl,
      },
    ],
  ];

  // Se tiver capa, envia como foto com caption; senão envia só mensagem
  if (rom.capaRef) {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHANNEL_ID,
          photo: rom.capaRef,
          caption,
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard },
        }),
      },
    );
    const data = await res.json();
    if (!data.ok) {
      console.error(
        `[telegram] Erro ao enviar ${rom.titulo}:`,
        data.description,
      );
    }
    return data.ok;
  } else {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHANNEL_ID,
          text: caption,
          parse_mode: "Markdown",
          reply_markup: { inline_keyboard },
        }),
      },
    );
    const data = await res.json();
    if (!data.ok) {
      console.error(
        `[telegram] Erro ao enviar ${rom.titulo}:`,
        data.description,
      );
    }
    return data.ok;
  }
}

export async function POST() {
  const admin = await verifyAdmin();
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN ou TELEGRAM_CHANNEL_ID não configurados" },
      { status: 500 },
    );
  }

  // Busca todas as ROMs que têm shortUrl
  const snapshot = await adminDb.collection("apps/prego-games/roms").get();
  const romsComLink = snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }) as any)
    .filter((rom) => rom.shortUrl);

  if (romsComLink.length === 0) {
    return NextResponse.json(
      { error: "Nenhuma ROM com shortUrl disponível" },
      { status: 400 },
    );
  }

  // Embaralha e pega 3 aleatórias (ou menos se não tiver 3)
  const shuffled = romsComLink.sort(() => Math.random() - 0.5);
  const selecionadas = shuffled.slice(0, Math.min(3, shuffled.length));

  let ok = 0;
  let falha = 0;

  for (const rom of selecionadas) {
    const enviou = await enviarRomNoTelegram(rom);
    if (enviou) ok++;
    else falha++;

    // Pausa entre mensagens para não bater rate limit do Telegram
    await new Promise((r) => setTimeout(r, 1000));
  }

  return NextResponse.json({
    message: `${ok} ROM(s) enviada(s) ao Telegram${falha > 0 ? `, ${falha} falha(s)` : ""}`,
    ok,
    falha,
  });
}

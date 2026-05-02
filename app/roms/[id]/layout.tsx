// app/roms/[id]/layout.tsx

import type { Metadata } from 'next';
import { adminDb } from '../../config/firebase-admin';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const doc = await adminDb.collection('apps/prego-games/roms').doc(id).get();

  if (!doc.exists) {
    return {
      title: 'Prego Games',
      description: 'Jogos retrô clássicos em PT-BR',
    };
  }

  const rom = doc.data()!;

  return {
    title: `${rom.titulo} — Prego Games`,
    description: rom.descricao,
    openGraph: {
      title: `${rom.titulo} — Prego Games`,
      description: rom.descricao,
      images: rom.capaRef ? [{ url: rom.capaRef }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${rom.titulo} — Prego Games`,
      description: rom.descricao,
      images: rom.capaRef ? [rom.capaRef] : [],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

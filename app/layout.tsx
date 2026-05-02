//app/layout.tsx

import './globals.css';

import { Geist, Geist_Mono } from 'next/font/google';

import type { Metadata } from 'next';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Prego Games — Jogos retrô clássicos em PT-BR',
  description:
    'Coleções cuidadosamente selecionadas dos melhores jogos retrô. Escolha seu pack e jogue agora. E todos em Português BR',
  metadataBase: new URL('https://prego-games-kohl.vercel.app'),
  openGraph: {
    title: 'Prego Games — Jogos retrô clássicos em PT-BR',
    description:
      'Coleções cuidadosamente selecionadas dos melhores jogos retrô. Escolha seu pack e jogue agora. E todos em Português BR',
    url: 'https://pregogames.com',
    siteName: 'Prego Games',
    images: [
      {
        url: 'https://i.ibb.co/F4cGPynP/prgo-games-logo-square.png',
        width: 1200,
        height: 630,
        alt: 'Prego Games',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prego Games — Jogos retrô clássicos',
    description:
      'Coleções cuidadosamente selecionadas dos melhores jogos retrô. Escolha seu pack e jogue agora.',
    images: ['https://i.ibb.co/F4cGPynP/prgo-games-logo-square.png'],
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='pt-br'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

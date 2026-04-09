'use client';
// app/packs/[id]/DownloadButton.tsx

import styles from './page.module.css';

interface Props {
  url: string;
  filename: string;
}

export default function DownloadButton({ url, filename }: Props) {
  function handleDownload() {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <button className={styles.btnDownload} onClick={handleDownload}>
      ↓ Baixar
    </button>
  );
}

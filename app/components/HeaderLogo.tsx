'use client';

import Link from 'next/link';
import styles from './HeaderLogo.module.css';

export default function Index() {
  return (
    <header className={styles.header}>
      <Link href='/home' className={styles.logo}>
        Prego<span className={styles.logoAccent}>.</span>Games
      </Link>
      <span className={styles.adminBadge}>Admin</span>
    </header>
  );
}

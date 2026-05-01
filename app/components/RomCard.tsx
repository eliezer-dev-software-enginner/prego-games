import { Rom } from '../types/rom.type';
import styles from './RomCard.module.css';

interface RomCardProps {
  rom: Rom;
  owned?: boolean;
  onBuy?: (rom: Rom) => void;
}

export default function RomCard({ rom, owned = false, onBuy }: RomCardProps) {
  if (owned) {
    return (
      <a
        href={rom.pathRef}
        target='_blank'
        rel='noopener noreferrer'
        className={styles.card}
      >
        <Cover rom={rom} />
        <div className={styles.cardBody}>
          <h3 className={styles.cardTitle}>{rom.titulo}</h3>
          <div className={styles.cardMeta}>
            <span className={styles.cardPrice}>R$ {rom.preco?.toFixed(2)}</span>
            <span className={styles.cardBadgeOwned}>✓ Adquirido</span>
          </div>
        </div>
      </a>
    );
  }

  return (
    <div className={styles.card}>
      <Cover rom={rom} />
      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{rom.titulo}</h3>
        <p className={styles.cardDesc}>{rom.descricao}</p>
        <div className={styles.cardMeta}>
          <span className={styles.cardPrice}>R$ {rom.preco?.toFixed(2)}</span>
          <span className={styles.cardBadge}>Avulso</span>
        </div>
        <button
          className={styles.btnBuy}
          onClick={(e) => {
            e.stopPropagation();
            onBuy?.(rom);
          }}
        >
          Comprar
        </button>
      </div>
    </div>
  );
}

function Cover({ rom }: { rom: Rom }) {
  return rom.capaRef ? (
    <img src={rom.capaRef} alt={rom.titulo} className={styles.cardCover} />
  ) : (
    <div className={styles.cardCoverPlaceholder}>🕹️</div>
  );
}

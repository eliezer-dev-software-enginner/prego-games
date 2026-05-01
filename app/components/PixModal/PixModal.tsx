// app/components/PixModal/PixModal.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

import styles from './PixModal.module.css';

interface PixData {
  success: boolean;
  paymentId?: string;
  qrCodeBase64?: string | null;
  qrCode?: string | null;
  status?: string;
  error?: string;
}

interface PixModalProps {
  itemName: string;
  pixData: PixData;
  onClose: () => void;
  onPaymentConfirmed: () => void;
}

type PaymentStatus = 'pending' | 'approved' | 'expired' | 'checking';

export default function PixModal({
  itemName,
  pixData,
  onClose,
  onPaymentConfirmed,
}: PixModalProps) {
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<PaymentStatus>('pending');
  const [secondsLeft, setSecondsLeft] = useState(300); // 5 min
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown timer
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          setStatus('expired');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, []);

  // Polling de status do pagamento
  useEffect(() => {
    if (!pixData.paymentId) return;

    pollRef.current = setInterval(async () => {
      try {
        setStatus('checking');
        const res = await fetch(
          `/api/checkout/status?paymentId=${pixData.paymentId}`,
        );
        const data = await res.json();

        if (data.status === 'approved') {
          clearInterval(pollRef.current!);
          clearInterval(intervalRef.current!);
          setStatus('approved');
          setTimeout(() => onPaymentConfirmed(), 1500);
        } else {
          setStatus('pending');
        }
      } catch {
        setStatus('pending');
      }
    }, 5000);

    return () => clearInterval(pollRef.current!);
  }, [pixData.paymentId, onPaymentConfirmed]);

  async function handleCopy() {
    if (!pixData.qrCode) return;
    await navigator.clipboard.writeText(pixData.qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const seconds = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.pixBadge}>PIX</div>
            <div>
              <p className={styles.headerLabel}>Pagamento para</p>
              <h2 className={styles.headerTitle}>{itemName}</h2>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Status */}
        {status === 'approved' && (
          <div className={styles.successBanner}>
            <span className={styles.successIcon}>✓</span>
            <span>Pagamento confirmado! Liberando acesso...</span>
          </div>
        )}
        {status === 'expired' && (
          <div className={styles.expiredBanner}>
            <span>⏰ QR Code expirado. Feche e tente novamente.</span>
          </div>
        )}

        {/* QR Code */}
        {status !== 'approved' && status !== 'expired' && (
          <>
            <div className={styles.qrSection}>
              {pixData.qrCodeBase64 ? (
                <div className={styles.qrWrapper}>
                  <img
                    src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                    alt='QR Code PIX'
                    className={styles.qrImage}
                  />
                  {status === 'checking' && (
                    <div className={styles.qrChecking}>
                      <div className={styles.spinner} />
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.qrPlaceholder}>
                  <span>QR Code indisponível</span>
                </div>
              )}

              <div className={styles.timer}>
                <span className={styles.timerIcon}>⏱</span>
                <span className={styles.timerValue}>
                  {minutes}:{seconds}
                </span>
                <span className={styles.timerLabel}>para expirar</span>
              </div>
            </div>

            <div className={styles.divider}>
              <span>ou copie o código</span>
            </div>

            {/* Copia e Cola */}
            {pixData.qrCode && (
              <div className={styles.copySection}>
                <div className={styles.copyCode}>
                  <span className={styles.copyCodeText}>
                    {pixData.qrCode.slice(0, 48)}...
                  </span>
                </div>
                <button
                  className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
                  onClick={handleCopy}
                >
                  {copied ? '✓ Copiado!' : 'Copiar código'}
                </button>
              </div>
            )}

            <ol className={styles.steps}>
              <li>Abra o app do seu banco</li>
              <li>Escolha pagar via PIX</li>
              <li>Escaneie o QR Code ou cole o código</li>
              <li>Confirme o pagamento — acesso liberado na hora ✓</li>
            </ol>
          </>
        )}
      </div>
    </div>
  );
}

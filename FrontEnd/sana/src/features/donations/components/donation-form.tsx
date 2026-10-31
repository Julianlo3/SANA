'use client';

import { useState, useEffect, useTransition } from 'react';
import { Heart, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import AmountSelector from './amount-selector';
import FeeTransparencyCard from './fee-transparency-card';
import TrustBadges from './trust-badges';
import DonationResultModal from './donation-result-modal';
import {
  prepareDonationCheckoutAction,
  verifyTransactionStatusAction,
} from '../actions/donation-actions';
import {
  calculateWompiFee,
  formatCOP,
  MIN_DONATION_COP,
} from '../services/wompi-service';
import type { DonationOperationResult } from '../types/donation-types';

const WOMPI_WIDGET_URL = 'https://checkout.wompi.co/widget.js';

// Extend Window interface to include Wompi Widget
declare global {
  interface Window {
    WidgetCheckout?: new (config: unknown) => {
      open: (callback: (result: { transaction?: { id: string; status: string } }) => void) => void;
    };
  }
}

/**
 * Component that handles the donation form without friction, delegating
 * donor contact capture directly to the official Wompi checkout modal.
 * @returns JSX.Element
 */
export default function DonationForm() {
  const [amountCOP, setAmountCOP] = useState<number>(20000);
  const [coverFee, setCoverFee] = useState<boolean>(true);

  // Estados de proceso
  const [isWidgetLoaded, setIsWidgetLoaded] = useState<boolean>(false);
  const [isPreparing, startPreparing] = useTransition();
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<DonationOperationResult | null>(null);

  // Carga reactiva del script del Widget de Wompi
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.WidgetCheckout) {
      setIsWidgetLoaded(true);
      return;
    }

    let script = document.querySelector<HTMLScriptElement>(`script[src="${WOMPI_WIDGET_URL}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = WOMPI_WIDGET_URL;
      script.async = true;
      document.head.appendChild(script);
    }

    const onLoad = () => setIsWidgetLoaded(true);
    const onError = () => {
      setErrorMessage('No pudimos conectar con la pasarela de pagos. Por favor refresca la página.');
    };

    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);

    return () => {
      script?.removeEventListener('load', onLoad);
      script?.removeEventListener('error', onError);
    };
  }, []);

  const { totalWithFee } = calculateWompiFee(amountCOP);
  const finalAmountToPay = coverFee ? totalWithFee : amountCOP;
  const isValidAmount = amountCOP >= MIN_DONATION_COP;

  const handleStartDonation = () => {
    if (!isValidAmount) {
      setErrorMessage(`El monto mínimo para donar es de ${formatCOP(MIN_DONATION_COP, true)}.`);
      return;
    }

    if (!window.WidgetCheckout) {
      setErrorMessage('La pasarela de pago aún se está preparando. Por favor espera un segundo.');
      return;
    }

    setErrorMessage(null);

    startPreparing(async () => {
      try {
        // 1. Obtener firma segura y referencia desde el Server Action
        const checkoutData = await prepareDonationCheckoutAction({
          amountCOP,
          coverFee,
        });

        // 2. Configurar el widget Wompi
        const widgetConfig = {
          currency: checkoutData.currency,
          amountInCents: checkoutData.amountInCents,
          reference: checkoutData.reference,
          publicKey: checkoutData.publicKey,
          signature: {
            integrity: checkoutData.signature,
          },
        };

        const checkout = new window.WidgetCheckout!(widgetConfig);

        // 3. Abrir modal de Wompi (Wompi solicita nombre, email y teléfono internamente)
        checkout.open(async (wompiResult) => {
          if (wompiResult?.transaction?.id) {
            setIsVerifying(true);
            try {
              const verification = await verifyTransactionStatusAction(
                wompiResult.transaction.id,
              );
              setResult(verification);
            } catch (err) {
              setResult({
                success: false,
                status: 'ERROR',
                message:
                  err instanceof Error
                    ? err.message
                    : 'Error al verificar la transacción con la pasarela.',
              });
            } finally {
              setIsVerifying(false);
            }
          }
        });
      } catch (err) {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Ocurrió un error al iniciar el proceso de donación.',
        );
      }
    });
  };

  const handleReset = () => {
    setResult(null);
    setErrorMessage(null);
    setAmountCOP(20000);
    setCoverFee(true);
  };

  // Si ya tenemos un resultado de donación, mostramos la tarjeta de resultado
  if (result) {
    return <DonationResultModal result={result} onReset={handleReset} />;
  }

  return (
    <div className="relative rounded-3xl border border-[var(--color-border)] bg-white p-6 sm:p-8 shadow-xl shadow-[var(--color-primary)]/5">
      {/* Badge decorativo superior */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)] mb-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-primary-dark)]">
          <Sparkles className="h-4 w-4 text-[var(--color-primary)]" />
          <span>Donación Directa</span>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-[11px] font-bold text-[var(--color-primary-dark)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
          <span>Wompi Bancolombia</span>
        </span>
      </div>

      <div className="space-y-6">
        {/* Selector de Montos con incrementadores rápidos e input manual */}
        <AmountSelector value={amountCOP} onChange={setAmountCOP} />

        {/* Transparencia de comisión Wompi y cuánto recibe la fundación */}
        <FeeTransparencyCard
          amountCOP={amountCOP}
          coverFee={coverFee}
          onToggleCoverFee={setCoverFee}
        />

        {/* Mensaje de error si ocurre alguno */}
        {errorMessage && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-red-50 p-3.5 text-xs text-red-700 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Botón CTA principal */}
        <button
          type="button"
          onClick={handleStartDonation}
          disabled={!isValidAmount || isPreparing || isVerifying || !isWidgetLoaded}
          className="group relative w-full cursor-pointer overflow-hidden rounded-full bg-[var(--color-accent)] px-8 py-4 font-display text-sm font-extrabold uppercase tracking-wider text-white shadow-lg shadow-[var(--color-accent)]/25 transition-all duration-200 hover:bg-[var(--color-accent-strong)] hover:shadow-xl hover:shadow-[var(--color-accent)]/35 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="flex items-center justify-center gap-2">
            {isPreparing || isVerifying ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>
                  {isVerifying ? 'Verificando con Wompi...' : 'Preparando pasarela segura...'}
                </span>
              </>
            ) : (
              <>
                <Heart className="h-5 w-5 fill-white transition-transform group-hover:scale-110" />
                <span>
                  Donar {formatCOP(finalAmountToPay, true)}
                </span>
              </>
            )}
          </div>
        </button>

        {/* Insignias de confianza y métodos aceptados */}
        <TrustBadges />
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useTransition, useSyncExternalStore } from 'react';
import { Heart, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import AmountSelector from './amount-selector';
import FeeTransparencyCard from './fee-transparency-card';
import TrustBadges from './trust-badges';
import DonationResultModal from './donation-result-modal';
import DataPolicyConsent from '@/features/consultation-requests/components/data-policy-consent';
import { DONATION_NOTICE } from '@/content/legal';
import { startDonationCheckout } from '../services/donation-checkout-service';
import {
  calculateWompiFee,
  formatCOP,
  MAX_DONATION_COP,
  MIN_DONATION_COP,
} from '../services/wompi-service';
import type { DonationOperationResult } from '../types/donation-types';

/**
 * Defines the wompi widget url.
 */
const WOMPI_WIDGET_URL = 'https://checkout.wompi.co/widget.js';
/**
 * Defines the wompi widget status event.
 */
const WOMPI_WIDGET_STATUS_EVENT = 'wompi-widget-status';

/**
 * Implements the subscribe to wompi widget operation.
 * @param onStoreChange on store change input.
 */
const subscribeToWompiWidget = (onStoreChange: () => void) => {
  window.addEventListener(WOMPI_WIDGET_STATUS_EVENT, onStoreChange);
  return () => window.removeEventListener(WOMPI_WIDGET_STATUS_EVENT, onStoreChange);
};

/**
 * Retrieves wompi widget snapshot.
 */
const getWompiWidgetSnapshot = () => Boolean(window.WidgetCheckout);
/**
 * Retrieves wompi widget server snapshot.
 */
const getWompiWidgetServerSnapshot = () => false;

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
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [termsError, setTermsError] = useState<string | undefined>(undefined);

  // Estados de proceso
  const isWidgetLoaded = useSyncExternalStore(
    subscribeToWompiWidget,
    getWompiWidgetSnapshot,
    getWompiWidgetServerSnapshot,
  );
  const [isPreparing, startPreparing] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<DonationOperationResult | null>(null);

  // Carga reactiva del script del Widget de Wompi
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.WidgetCheckout) {
      return;
    }

    let script = document.querySelector<HTMLScriptElement>(`script[src="${WOMPI_WIDGET_URL}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = WOMPI_WIDGET_URL;
      script.async = true;
      document.head.appendChild(script);
    }

    const onLoad = () => {
      window.dispatchEvent(new Event(WOMPI_WIDGET_STATUS_EVENT));
    };
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

  const isValidAmount =
    Number.isSafeInteger(amountCOP) &&
    amountCOP >= MIN_DONATION_COP &&
    amountCOP <= MAX_DONATION_COP;
  const totalWithFee = isValidAmount
    ? calculateWompiFee(amountCOP).totalWithFee
    : 0;
  const finalAmountToPay =
    coverFee && isValidAmount ? totalWithFee : amountCOP;

  const handleStartDonation = () => {
    if (!isValidAmount) {
      setErrorMessage(
        amountCOP > MAX_DONATION_COP
          ? `El monto máximo para donar en línea es de ${formatCOP(MAX_DONATION_COP, true)}.`
          : `El monto mínimo para donar es de ${formatCOP(MIN_DONATION_COP, true)}.`,
      );
      return;
    }

    if (!termsAccepted) {
      setTermsError('Debes aceptar las condiciones de donación para continuar.');
      return;
    }

    if (!window.WidgetCheckout) {
      setErrorMessage('La pasarela de pago aún se está preparando. Por favor espera un segundo.');
      return;
    }

    setErrorMessage(null);

    startPreparing(async () => {
      try {
        // 1. The backend records consent and signs the checkout reference.
        const checkoutData = await startDonationCheckout({
          amountCOP,
          coverFee,
          termsAccepted,
        });

        // 2. Configure the Wompi widget.
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

        // 3. Open the Wompi modal; the widget collects name, email, and phone.
        checkout.open((wompiResult) => {
          if (wompiResult?.transaction?.id) {
            // The widget callback updates the UI only. The webhook is the
            // source of truth and the only place that records the donation.
            setResult({
              success: true,
              status: 'PENDING',
              transactionId: wompiResult.transaction.id,
              message: 'Estamos esperando la confirmación oficial de Wompi.',
            });
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
    setTermsAccepted(false);
    setTermsError(undefined);
  };

  // Show the result modal after the donation flow completes.
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

        <p className="rounded-2xl bg-[var(--color-primary-soft)]/40 p-4 text-xs leading-relaxed text-[var(--color-text-muted)]">
          {DONATION_NOTICE}
        </p>

        <DataPolicyConsent
          checked={termsAccepted}
          onChange={(checked) => {
            setTermsAccepted(checked);
            if (checked) setTermsError(undefined);
          }}
          error={termsError}
          policyType="donation_terms"
          disabled={isPreparing}
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
          disabled={!isValidAmount || !termsAccepted || isPreparing || !isWidgetLoaded}
          className="group relative w-full cursor-pointer overflow-hidden rounded-full bg-[var(--color-accent)] px-8 py-4 font-display text-sm font-extrabold uppercase tracking-wider text-white shadow-lg shadow-[var(--color-accent)]/25 transition-all duration-200 hover:bg-[var(--color-accent-strong)] hover:shadow-xl hover:shadow-[var(--color-accent)]/35 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div className="flex items-center justify-center gap-2">
            {isPreparing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>
                  Preparando pasarela segura...
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

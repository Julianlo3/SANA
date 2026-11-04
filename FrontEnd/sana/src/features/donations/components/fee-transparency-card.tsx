'use client';

import { Heart, Info, Check, Sparkles } from 'lucide-react';
import {
  calculateWompiFee,
  formatCOP,
  MAX_DONATION_COP,
  MIN_DONATION_COP,
} from '../services/wompi-service';

/**
 * Props for the FeeTransparencyCard component, which displays the fee transparency card and calculates how much the foundation actually receives.
 */
interface FeeTransparencyCardProps {
  readonly amountCOP: number;
  readonly coverFee: boolean;
  readonly onToggleCoverFee: (covered: boolean) => void;
}

/**
 * Component that displays the fee transparency card and explicitly calculates
 * how much the foundation actually receives.
 * @param amountCOP Amount of the donation
 * @param coverFee Whether the donation covers the fee
 * @param onToggleCoverFee Function to update whether the donation covers the fee
 * @returns JSX.Element
 */
export default function FeeTransparencyCard({
  amountCOP,
  coverFee,
  onToggleCoverFee,
}: FeeTransparencyCardProps) {
  if (amountCOP < MIN_DONATION_COP || amountCOP > MAX_DONATION_COP) {
    return null;
  }

  const {
    baseAmount,
    feeAmount,
    percentageFeeAmount,
    fixedFeeAmount,
    ivaAmount,
    totalWithFee,
    coveredFeeAmount,
    coveredPercentageFeeAmount,
    coveredFixedFeeAmount,
    coveredIvaAmount,
    netReceivedIfCovered,
    netReceivedIfNotCovered,
  } = calculateWompiFee(amountCOP);

  const displayedFee = coverFee ? coveredFeeAmount : feeAmount;
  const displayedPercentageFee = coverFee
    ? coveredPercentageFeeAmount
    : percentageFeeAmount;
  const displayedFixedFee = coverFee ? coveredFixedFeeAmount : fixedFeeAmount;
  const displayedIva = coverFee ? coveredIvaAmount : ivaAmount;
  const netReceived = coverFee ? netReceivedIfCovered : netReceivedIfNotCovered;

  return (
    <div className="rounded-2xl border border-[var(--color-primary)]/25 bg-[var(--color-primary-soft)]/40 p-4 transition-all">
      {/* Checkbox voluntario */}
      <label className="flex items-start gap-3 cursor-pointer select-none">
        <div className="relative flex items-center pt-0.5">
          <input
            id="cover-fee-checkbox"
            type="checkbox"
            checked={coverFee}
            onChange={(e) => onToggleCoverFee(e.target.checked)}
            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-[var(--color-primary)] bg-white checked:bg-[var(--color-primary)] checked:border-[var(--color-primary)] transition-colors focus:ring-2 focus:ring-[var(--color-primary-soft)] outline-none"
          />
          <Check className="pointer-events-none absolute h-3.5 w-3.5 text-white left-0.5 top-1.5 opacity-0 peer-checked:opacity-100 transition-opacity" />
        </div>

        <div className="flex-1 text-xs">
          <span className="font-bold text-[var(--color-text)] flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-[var(--color-accent)] fill-[var(--color-accent)]" />
            <span>Deseo cubrir la comisión estimada de Wompi ({formatCOP(coveredFeeAmount)})</span>
          </span>
          <p className="mt-0.5 text-[var(--color-text-muted)] leading-relaxed">
            Así, el aporte destinado a la fundación no se reduce por esta comisión.
          </p>
        </div>
      </label>

      <div className="mt-3.5 space-y-1.5 rounded-xl border border-[var(--color-primary)]/15 bg-white/70 p-3 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
        <p>
          Estimado según el Plan Avanzado Agregador: 2,65% del pago + $700 COP,
          más IVA del 19% sobre la comisión, por transacción exitosa.
        </p>
        <p>
          La tarifa puede variar si el comercio tiene condiciones negociadas;
          Wompi publica una tarifa especial para pagos con código QR.
        </p>
        <a
          href="https://wompi.com/es/co/planes-tarifas/plan-avanzado-agregador"
          target="_blank"
          rel="noreferrer"
          className="inline-flex font-semibold text-[var(--color-primary-dark)] underline underline-offset-2"
        >
          Consultar tarifas oficiales de Wompi
        </a>
      </div>

      <div className="mt-3.5 space-y-2 border-t border-[var(--color-primary)]/15 pt-3 text-xs">
        <div className="flex justify-between text-[var(--color-text-muted)]">
          <span>Aporte que deseas hacer:</span>
          <span className="font-semibold text-[var(--color-text)]">
            {formatCOP(baseAmount)}
          </span>
        </div>

        <div className="flex justify-between text-[var(--color-text-muted)]">
          <span>Comisión variable (2,65% del pago total):</span>
          <span>{formatCOP(displayedPercentageFee)}</span>
        </div>

        <div className="flex justify-between text-[var(--color-text-muted)]">
          <span>Comisión fija:</span>
          <span>{formatCOP(displayedFixedFee)}</span>
        </div>

        <div className="flex justify-between text-[var(--color-text-muted)]">
          <span>IVA (19% sobre la comisión):</span>
          <span>{formatCOP(displayedIva)}</span>
        </div>

        <div className="flex justify-between font-semibold text-[var(--color-text)]">
          <span className="inline-flex items-center gap-1">
            <span>Comisión total estimada:</span>
            <Info
              className="h-3 w-3 text-[var(--color-primary)]"
              aria-label="El cálculo se basa en la tarifa pública estándar de Wompi."
            />
          </span>
          <span>
            {coverFee ? "+" : "-"} {formatCOP(displayedFee)}
          </span>
        </div>

        <div className="rounded-xl bg-white/80 border border-[var(--color-primary)]/20 p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-[var(--color-primary)] shrink-0" />
            <span className="font-bold text-[var(--color-text)] text-xs">
              La fundación recibe realmente:
            </span>
          </div>

          <div className="text-right">
            <span className="font-extrabold text-[var(--color-primary-dark)] text-sm">
              {formatCOP(netReceived)}
            </span>
            {coverFee && (
              <span className="block text-[10px] text-emerald-700 font-semibold">
                {netReceived >= baseAmount ? "Aporte completo" : ""}
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-between pt-1 border-t border-[var(--color-primary)]/15 text-sm font-bold text-[var(--color-text)]">
          <span>Total a pagar:</span>
          <span className="text-[var(--color-primary-dark)] font-black text-base">
            {formatCOP(coverFee ? totalWithFee : baseAmount, true)}
          </span>
        </div>
      </div>
    </div>
  );
}

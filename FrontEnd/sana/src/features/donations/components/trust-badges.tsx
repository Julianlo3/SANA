import { ShieldCheck, CreditCard, Building2, Smartphone } from 'lucide-react';

/**
 * Component that displays trust badges about the payment security
 * @returns JSX.Element
 */
export default function TrustBadges() {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]/60 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        <ShieldCheck className="h-4 w-4 text-[var(--color-primary)]" />
        <span>Pago 100% Seguro · Cifrado Bancario SSL</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] text-[var(--color-text-muted)] border-t border-[var(--color-border)]/60">
        <div className="flex items-center gap-1.5 font-medium">
          <Building2 className="h-3.5 w-3.5 text-[var(--color-primary)]" />
          <span>Bancolombia</span>
        </div>

        <div className="flex items-center gap-1.5 font-medium">
          <span className="rounded bg-[var(--color-primary-soft)] px-1.5 py-0.5 font-bold text-[var(--color-primary-dark)] text-[10px]">
            PSE
          </span>
          <span>Débito cuenta</span>
        </div>

        <div className="flex items-center gap-1.5 font-medium">
          <CreditCard className="h-3.5 w-3.5 text-[var(--color-accent)]" />
          <span>Visa · Mastercard · Amex</span>
        </div>

        <div className="flex items-center gap-1.5 font-medium">
          <Smartphone className="h-3.5 w-3.5 text-[#5A189A]" />
          <span>Nequi</span>
        </div>
      </div>
    </div>
  );
}

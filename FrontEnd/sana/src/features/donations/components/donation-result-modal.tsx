'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Copy,
  Check,
  Mail,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { formatCOP } from '../services/wompi-service';
import type { DonationOperationResult } from '../types/donation-types';

interface DonationResultModalProps {
  result: DonationOperationResult;
  onReset: () => void;
}

/**
 * Component that displays the result of the donation
 * @param result DonationOperationResult
 * @param onReset Function to reset the donation form
 * @returns JSX.Element
 */
export default function DonationResultModal({
  result,
  onReset,
}: DonationResultModalProps) {
  const [copied, setCopied] = useState(false);
  const isApproved = result.status === 'APPROVED';
  const isPending = result.status === 'PENDING';

  const handleCopyReference = () => {
    if (!result.reference) return;
    navigator.clipboard.writeText(result.reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="rounded-3xl border border-[var(--color-border)] bg-white p-6 sm:p-8 shadow-xl shadow-[var(--color-primary)]/5 text-center animate-in fade-in-50 duration-300">
      {/* Icono de estado dinámico */}
      <div className="mx-auto flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full mb-5">
        {isApproved ? (
          <div className="h-full w-full rounded-full bg-[var(--color-primary-soft)] flex items-center justify-center text-[var(--color-primary)]">
            <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12" />
          </div>
        ) : isPending ? (
          <div className="h-full w-full rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
            <Clock className="h-10 w-10 sm:h-12 sm:w-12 animate-pulse" />
          </div>
        ) : (
          <div className="h-full w-full rounded-full bg-red-50 flex items-center justify-center text-red-500">
            <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12" />
          </div>
        )}
      </div>

      {/* Título y Mensajería principal según estándar de donaciones */}
      {isPending ? (
        <div className="space-y-3">
          <h3 className="font-display text-2xl sm:text-3xl font-black text-[var(--color-text)]">
            Estamos validando tu donación
          </h3>
          <p className="text-sm text-[var(--color-text-muted)] max-w-lg mx-auto leading-relaxed">
            Tu pago está pendiente de confirmación por tu entidad financiera. Con PSE o transferencias esto suele tardar unos minutos, pero a veces toma más tiempo.
          </p>
          <p className="text-xs sm:text-sm font-semibold text-[var(--color-primary-dark)] bg-[var(--color-primary-soft)]/60 py-2 px-4 rounded-xl max-w-md mx-auto">
            Puedes cerrar esta pantalla. Cuando el banco confirme, te enviaremos el comprobante y nuestro agradecimiento a tu correo.
          </p>
        </div>
      ) : isApproved ? (
        <div className="space-y-2">
          <h3 className="font-display text-2xl sm:text-3xl font-black text-[var(--color-text)]">
            ¡Muchas gracias por tu generosidad!
          </h3>
          <p className="text-sm text-[var(--color-text-muted)] max-w-md mx-auto leading-relaxed">
            Tu donación ha sido aprobada con éxito. Tu aporte llega directamente para apoyar la nutrición, psicología y acompañamiento de nuestras niñas y niños.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="font-display text-2xl sm:text-3xl font-black text-[var(--color-text)]">
            Transacción no completada
          </h3>
          <p className="text-sm text-[var(--color-text-muted)] max-w-md mx-auto leading-relaxed">
            {result.message ||
              'La entidad bancaria no aprobó la transacción en este intento. Puedes probar nuevamente con otro medio de pago.'}
          </p>
        </div>
      )}

      {/* Tarjeta de Referencia y Resumen */}
      <div className="my-6 rounded-2xl bg-[var(--color-surface-muted)] p-4 sm:p-5 text-xs text-left max-w-lg mx-auto border border-[var(--color-border)] space-y-3">
        {result.amountCOP ? (
          <div className="flex justify-between items-center font-bold text-sm text-[var(--color-text)] pb-2.5 border-b border-[var(--color-border)]">
            <span>Monto del aporte:</span>
            <span className="text-[var(--color-primary-dark)] font-black text-lg">
              {formatCOP(result.amountCOP, true)}
            </span>
          </div>
        ) : null}

        {/* Fila de Referencia con botón de Copiar */}
        {result.reference ? (
          <div className="flex items-center justify-between gap-2 pt-1">
            <div>
              <span className="block text-[11px] text-[var(--color-text-muted)] font-medium">
                Tu referencia única:
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold text-[var(--color-text)]">
                {result.reference}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyReference}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[var(--color-text)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary-dark)] transition-colors cursor-pointer"
              title="Copiar referencia"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copiada</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        ) : null}

        {result.paymentMethodType ? (
          <div className="flex justify-between text-[var(--color-text-muted)] pt-1 border-t border-[var(--color-border)]/60">
            <span>Método de pago:</span>
            <span className="font-medium text-[var(--color-text)]">
              {result.paymentMethodType}
            </span>
          </div>
        ) : null}

        {result.donorEmail ? (
          <div className="flex justify-between text-[var(--color-text-muted)]">
            <span>Correo para soporte:</span>
            <span className="font-medium text-[var(--color-text)]">
              {result.donorEmail}
            </span>
          </div>
        ) : null}
      </div>

      {/* Caja de recomendaciones preventiva para PENDING (Anti-duplicación y contacto) */}
      {isPending && (
        <div className="my-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 p-4 text-xs text-left max-w-lg mx-auto space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Recomendaciones importantes para tu donación:</span>
          </div>

          <ul className="space-y-1.5 text-amber-800/90 pl-5 list-disc leading-relaxed text-[11px] sm:text-xs">
            <li>
              <strong>Para no donar dos veces:</strong> evita repetir el pago mientras esperas la confirmación de tu banco.
            </li>
            <li>
              Si en unas horas no recibes ningún correo (recuerda revisar también la carpeta de <strong>spam o correo no deseado</strong>), escríbenos a{' '}
              <a
                href={`mailto:dejandohuellasfelicespopayan@gmail.com?subject=Consulta%20Donacion%20${result.reference || ''}`}
                className="font-bold underline text-amber-900 hover:text-amber-950"
              >
                dejandohuellasfelicespopayan@gmail.com
              </a>{' '}
              adjuntando tu referencia.
            </li>
          </ul>
        </div>
      )}

      {/* Aviso de confirmación por correo para APPROVED */}
      {isApproved && (
        <div className="my-5 rounded-2xl bg-[var(--color-primary-soft)]/50 border border-[var(--color-primary)]/20 p-3.5 text-xs text-[var(--color-primary-dark)] max-w-lg mx-auto flex items-center justify-center gap-2">
          <Mail className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
          <span>
            Wompi ha enviado el recibo bancario y la fundación enviará la constancia a tu correo electrónico.
          </span>
        </div>
      )}

      {/* Botones de acción principal */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
        {isApproved || isPending ? (
          <>
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border-2 border-[var(--color-border)] bg-white px-6 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-text)] transition hover:bg-[var(--color-surface-muted)] cursor-pointer"
            >
              <span>Volver al inicio</span>
            </Link>

            <button
              type="button"
              onClick={onReset}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-[var(--color-primary-dark)] cursor-pointer"
            >
              <Heart className="h-4 w-4 fill-white" />
              <span>Hacer otra donación</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onReset}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-[var(--color-accent-strong)] cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Intentar nuevamente</span>
          </button>
        )}
      </div>

      <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
        <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-primary)]" />
        <span>Transacción procesada y respaldada por Wompi Bancolombia</span>
      </div>
    </div>
  );
}

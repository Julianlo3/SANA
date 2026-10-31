'use client';

import { useState, useEffect } from 'react';
import { RotateCcw, Plus, Edit3 } from 'lucide-react';
import { formatCOP, MIN_DONATION_COP } from '../services/wompi-service';

interface AmountSelectorProps {
  value: number;
  onChange: (newAmount: number) => void;
}

// Opciones para sumar al monto
const INCREMENT_OPTIONS = [
  { label: '+ $1.000', amount: 1000 },
  { label: '+ $5.000', amount: 5000 },
  { label: '+ $10.000', amount: 10000 },
  { label: '+ $50.000', amount: 50000 },
  { label: '+ $100.000', amount: 100000 },
];

/**
 * Component that allows the user to select the amount of their donation
 * @param value Amount of the donation
 * @param onChange Function to update the amount of the donation
 * @returns JSX.Element
 */
export default function AmountSelector({ value, onChange }: AmountSelectorProps) {
  const [isEditingManually, setIsEditingManually] = useState(false);
  const [rawInputValue, setRawInputValue] = useState(value > 0 ? String(value) : '');

  // Sincronizar el input si el valor cambia por los botones
  useEffect(() => {
    if (!isEditingManually) {
      setRawInputValue(value > 0 ? String(value) : '');
    }
  }, [value, isEditingManually]);

  const handleAdd = (increment: number) => {
    const current = Math.max(0, value);
    const next = current + increment;
    onChange(next);
  };

  const handleReset = () => {
    onChange(0);
    setRawInputValue('');
    setIsEditingManually(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permitir sólo dígitos enteros
    const clean = e.target.value.replace(/\D/g, '');
    setRawInputValue(clean);
    const parsed = clean ? parseInt(clean, 10) : 0;
    onChange(parsed);
  };

  const isBelowMin = value > 0 && value < MIN_DONATION_COP;

  return (
    <div className="space-y-4">
      {/* Encabezado y etiqueta */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-[var(--color-text)]">
          Monto de tu donación
        </label>
        {value > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-accent-strong)] transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reiniciar</span>
          </button>
        )}
      </div>

      {/* Visor / Input principal del monto */}
      <div
        className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-200 bg-white ${isBelowMin
          ? 'border-amber-300 ring-2 ring-amber-100'
          : value >= MIN_DONATION_COP
            ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary-soft)]'
            : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
          }`}
      >
        <div className="flex items-center px-4 py-3 sm:py-4">
          <span className="text-xl sm:text-2xl font-black text-[var(--color-primary-dark)] mr-1 select-none">
            $
          </span>

          <input
            id="donation-amount-input"
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={
              isEditingManually
                ? rawInputValue
                : value > 0
                  ? new Intl.NumberFormat('es-CO').format(value)
                  : ''
            }
            onFocus={() => setIsEditingManually(true)}
            onBlur={() => setIsEditingManually(false)}
            onChange={handleInputChange}
            className="w-full text-2xl sm:text-3xl font-extrabold text-[var(--color-text)] outline-none bg-transparent placeholder-[var(--color-text-subtle)]/40"
          />

          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] select-none ml-2">
            COP
          </span>
        </div>

        {/* Indicador de ayuda al pie del input */}
        <div className="flex items-center justify-between bg-[var(--color-surface-muted)] px-4 py-1.5 text-[11px] text-[var(--color-text-muted)] border-t border-[var(--color-border)]">
          <span className="flex items-center gap-1">
            <Edit3 className="h-3 w-3 text-[var(--color-primary)]" />
            <span>Puedes digitar cualquier valor o sumar con los botones</span>
          </span>

          {isBelowMin ? (
            <span className="font-semibold text-amber-700">
              Mínimo $ {MIN_DONATION_COP.toLocaleString('es-CO')} COP
            </span>
          ) : value >= MIN_DONATION_COP ? (
            <span className="font-semibold text-[var(--color-primary-dark)]">
              {formatCOP(value)}
            </span>
          ) : null}
        </div>
      </div>

      {/* Botones de adición continua que suman al valor actual */}
      <div>
        <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-2">
          Suma rápida a tu donación:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {INCREMENT_OPTIONS.map((opt) => (
            <button
              key={opt.amount}
              type="button"
              onClick={() => handleAdd(opt.amount)}
              className="group relative flex items-center justify-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2.5 text-xs sm:text-sm font-bold text-[var(--color-text)] shadow-xs transition-all duration-150 hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary-dark)] active:scale-95 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-[var(--color-primary)] group-hover:scale-110 transition-transform" />
              <span>{opt.label.replace('+ ', '')}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { User, Mail } from 'lucide-react';

interface DonorFieldsProps {
  fullName: string;
  email: string;
  onFullNameChange: (val: string) => void;
  onEmailChange: (val: string) => void;
}

/**
 * Component that handles the donor contact fields
 * @param fullName Donor's full name
 * @param email Donor's email
 * @param onFullNameChange Function to update the donor's full name
 * @param onEmailChange Function to update the donor's email
 * @returns JSX.Element
 */
export default function DonorFields({
  fullName,
  email,
  onFullNameChange,
  onEmailChange,
}: DonorFieldsProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-bold text-[var(--color-text)]">
          Datos de contacto
        </label>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
          Wompi requiere estos datos para emitir tu comprobante y enviarte el recibo bancario oficial.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 transition-all duration-200">
        {/* Nombre completo */}
        <div>
          <label
            htmlFor="donor-name-input"
            className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1"
          >
            Nombre completo
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-subtle)]" />
            <input
              id="donor-name-input"
              type="text"
              placeholder="Tu nombre y apellido"
              value={fullName}
              onChange={(e) => onFullNameChange(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-white py-2.5 pl-9 pr-3 text-sm text-[var(--color-text)] placeholder-[var(--color-text-subtle)]/60 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)]"
            />
          </div>
        </div>

        {/* Correo electrónico */}
        <div>
          <label
            htmlFor="donor-email-input"
            className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1"
          >
            Correo electrónico
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-subtle)]" />
            <input
              id="donor-email-input"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border)] bg-white py-2.5 pl-9 pr-3 text-sm text-[var(--color-text)] placeholder-[var(--color-text-subtle)]/60 outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

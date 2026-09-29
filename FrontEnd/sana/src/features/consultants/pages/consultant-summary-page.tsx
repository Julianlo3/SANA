"use client";

import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import { formatRelativeDate } from "@/lib/format/date-time";
import ConsultantHeader from "../components/consultant-header";
import { useConsultantRecord } from "../hooks/use-consultant-record";
import { getConsultantForAssistant } from "../services/consultants-service";
import type { ConsultantSummary } from "../types/consultant-types";

type Props = {
  consultantId: number;
};

/**
 * HU-2.4.1: ficha del consultante tal como la ve la asistente.
 * No incluye motivo de consulta ni observaciones — esos campos ni siquiera
 * existen en ConsultantSummary, así que no hay nada que ocultar aquí: el
 * backend nunca los envía a este endpoint.
 */
export default function ConsultantSummaryPage({ consultantId }: Props) {
  const { record: consultant, isLoading, loadError } = useConsultantRecord<
    ConsultantSummary
  >(
    consultantId,
    getConsultantForAssistant,
    "No pudimos cargar la ficha. Intenta de nuevo.",
  );

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/consultantes"
        className="inline-flex items-center gap-2 text-sm text-text-muted transition hover:text-primary"
      >
        <ArrowLeft size={16} aria-hidden />
        Volver al listado
      </Link>

      {isLoading && (
        <p className="mt-8 text-sm text-text-subtle">Cargando ficha…</p>
      )}

      {loadError && (
        <div className="mt-8">
          <InlineMessage tone="error">{loadError}</InlineMessage>
        </div>
      )}

      {consultant && (
        <div className="mt-6 space-y-6">
          <ConsultantHeader
            fullName={consultant.fullName}
            identityDocument={consultant.identityDocument}
          />

          <div className="grid gap-4 rounded-2xl border border-border bg-surface p-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
                Correo
              </p>
              <p className="mt-1 text-sm text-text">{consultant.email}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
                Teléfono
              </p>
              <p className="mt-1 text-sm text-text">{consultant.phone}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
                Profesional asignado
              </p>
              <p className="mt-1 text-sm text-text">
                {consultant.assignedPsychologistName ?? "Sin asignar"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
                Última cita
              </p>
              <p className="mt-1 text-sm text-text">
                {consultant.lastAppointmentAt
                  ? formatRelativeDate(consultant.lastAppointmentAt)
                  : "Sin citas registradas"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-2xl border border-dashed border-border bg-surface-muted p-4 text-xs text-text-subtle">
            <Lock size={16} className="mt-0.5 shrink-0" aria-hidden />
            El motivo de consulta y las observaciones de la atención son
            visibles únicamente para el profesional tratante.
          </div>
        </div>
      )}
    </div>
  );
}
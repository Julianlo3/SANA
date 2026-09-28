"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, User } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import { formatRelativeDate } from "@/lib/format/date-time";
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
  const [consultant, setConsultant] = useState<ConsultantSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getConsultantForAssistant(consultantId)
      .then((result) => {
        if (isMounted) setConsultant(result);
      })
      .catch(() => {
        if (isMounted) {
          setLoadError("No pudimos cargar la ficha. Intenta de nuevo.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [consultantId]);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/consultants"
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
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
              <User size={24} aria-hidden />
            </span>
            <div>
              <h1 className="font-display text-2xl font-bold text-text">
                {consultant.fullName}
              </h1>
              <p className="text-sm text-text-subtle">
                Documento {consultant.identityDocument}
              </p>
            </div>
          </div>

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
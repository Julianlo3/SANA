"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText, User } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import { formatRelativeDate } from "@/lib/format/date-time";
import { getConsultantForPsychologist } from "../services/consultants-service";
import type { ConsultantFullRecord } from "../types/consultant-types";

type Props = {
  consultantId: number;
};

/**
 * HU-2.4.2: ficha completa del consultante, tal como la ve su psicólogo
 * tratante. Incluye motivo de consulta e historial de observaciones.
 *
 * HU-2.4.3: si el backend determina que quien pregunta no es el tratante,
 * responde con un error que aquí se traduce en el mensaje de "permisos
 * insuficientes" — esta pantalla no decide nada sobre permisos, solo
 * refleja lo que el backend permitió o negó.
 */
export default function ConsultantFullRecordPage({ consultantId }: Props) {
  const [consultant, setConsultant] = useState<ConsultantFullRecord | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getConsultantForPsychologist(consultantId)
      .then((result) => {
        if (isMounted) setConsultant(result);
      })
      .catch(() => {
        if (isMounted) {
          setLoadError(
            "No tienes permisos para ver esta ficha, o no pudimos cargarla.",
          );
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
          </div>

          <div className="rounded-2xl border border-accent-soft bg-accent-soft/40 p-6">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent-strong">
              <FileText size={14} aria-hidden />
              Motivo de consulta
            </p>
            <p className="mt-2 text-sm text-text">
              {consultant.consultationReason || "Sin registrar."}
            </p>
          </div>

          <div>
            <h2 className="font-display text-lg font-bold text-text">
              Historial de atenciones
            </h2>

            {consultant.careRecords.length === 0 ? (
              <p className="mt-3 text-sm text-text-subtle">
                Todavía no hay atenciones registradas.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {consultant.careRecords.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-xl border border-border bg-surface p-4"
                  >
                    <p className="text-xs font-semibold text-text-subtle">
                      {formatRelativeDate(record.attendedAt)}
                    </p>
                    <p className="mt-1 text-sm text-text">
                      {record.observation || "Sin observación registrada."}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
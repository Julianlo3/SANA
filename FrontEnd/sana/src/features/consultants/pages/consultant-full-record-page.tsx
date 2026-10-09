"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import { formatRelativeDate } from "@/lib/format/date-time";
import { useConsultantRecord } from "../hooks/use-consultant-record";
import { getConsultantClinicalNotes } from "../services/consultants-service";
import type { ConsultantAttentionHistory } from "../types/consultant-types";

type Props = {
  consultantId: number;
};

/**
 * Historial de notas clínicas tal como lo ve el psicólogo tratante.
 *
 * El backend aplica el control de acceso y esta pantalla refleja el
 * resultado permitido o denegado.
 */
export default function ConsultantFullRecordPage({ consultantId }: Props) {
  const { record: history, isLoading, loadError } = useConsultantRecord<
    ConsultantAttentionHistory
  >(
    consultantId,
    getConsultantClinicalNotes,
    "No tienes permisos para ver estas notas, o no pudimos cargarlas.",
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
        <p className="mt-8 text-sm text-text-subtle">
          Cargando notas clínicas…
        </p>
      )}

      {loadError && (
        <div className="mt-8">
          <InlineMessage tone="error">{loadError}</InlineMessage>
        </div>
      )}

      {history && (
        <div className="mt-6 space-y-6">
          <h1 className="font-display text-2xl font-bold text-text">
            Notas clínicas de {history.requesterName}
          </h1>

          <div>
            <h2 className="font-display text-lg font-bold text-text">
              Notas clínicas
            </h2>

            {history.notes.length === 0 ? (
              <p className="mt-3 text-sm text-text-subtle">
                No hay notas clínicas registradas para este consultante.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {history.notes.map((note) => (
                  <div
                    key={note.cnId}
                    className="rounded-xl border border-border bg-surface p-4"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <p className="text-xs font-semibold text-text-subtle">
                        Atención {formatRelativeDate(note.appDate)}
                      </p>
                      <p className="text-xs text-text-subtle">
                        Registrada por {note.psychologistName}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-text">
                      {note.cnObservation || "Sin observación registrada."}
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
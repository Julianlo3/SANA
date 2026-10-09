"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import { formatDateTime } from "@/features/appointments/lib/appointment-format";
import { ApiError } from "@/types/api-types";
import { getClinicalNotesForAppointment } from "../services/care-record-service";
import type { ClinicalNote } from "../types/care-record-types";

type Props = {
  appointmentId: number;
};

/**
 * Renders the clinical notes page for a specific appointment.
 * @param param0 - An object containing the appointment ID.
 * @returns A React component that displays the appointment's clinical notes.
 */
export default function AppointmentClinicalNotesPage({
  appointmentId,
}: Props) {
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    getClinicalNotesForAppointment(appointmentId, controller.signal)
      .then(setNotes)
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof ApiError
            ? error.message
            : "No pudimos cargar la nota clínica. Intenta de nuevo.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [appointmentId]);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/mis-citas"
        className="inline-flex items-center gap-2 text-sm text-text-muted transition hover:text-primary"
      >
        <ArrowLeft size={16} aria-hidden />
        Volver a mis citas
      </Link>

      <h1 className="mt-6 font-display text-3xl font-bold text-primary-dark">
        Nota clínica
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        Cita #{appointmentId}
      </p>

      {isLoading && (
        <p className="mt-8 text-sm text-text-subtle">
          Cargando nota clínica…
        </p>
      )}

      {loadError && (
        <div className="mt-8">
          <InlineMessage tone="error">{loadError}</InlineMessage>
        </div>
      )}

      {!isLoading && !loadError && notes.length === 0 && (
        <p className="mt-6 rounded-2xl border border-border bg-surface px-5 py-8 text-sm text-text-subtle">
          No hay notas clínicas registradas para esta cita.
        </p>
      )}

      {!isLoading && !loadError && notes.length > 0 && (
        <div className="mt-6 space-y-3">
          {notes.map((note) => (
            <article
              key={note.cnId}
              className="rounded-2xl border border-border bg-surface p-5"
            >
              <p className="flex items-center gap-2 text-xs font-semibold text-text-subtle">
                <FileText size={14} aria-hidden />
                Registrada {formatDateTime(note.cnCreatedAt)}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm text-text">
                {note.cnObservation || "Sin observación registrada."}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

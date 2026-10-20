"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ClipboardCheck,
  Clock,
  FileText,
  Lock,
  MapPin,
  Video,
} from "lucide-react";
import AppointmentStateBadge from "@/features/appointments/components/appointment-state-badge";
import {
  APPOINTMENT_MODE_LABELS,
  formatDateTime,
} from "@/features/appointments/lib/appointment-format";
import { ApiError } from "@/types/api-types";
import { getAppointmentClinicalNotes } from "../services/my-appointments-service";
import type {
  AppointmentClinicalNote,
  MyAppointment,
} from "../types/my-appointments-types";

type Props = {
  readonly appointment: MyAppointment;
};

/**
 * Component that displays a card with information about a single appointment.
 * @param param0 The props containing the appointment to display.
 * @returns The appointment card component.
 */
export default function MyAppointmentCard({ appointment }: Props) {
  const ModeIcon = appointment.appType === "virtual" ? Video : MapPin;
  const canRecord = appointment.appState === "confirmada";
  const [clinicalNotes, setClinicalNotes] = useState<
    AppointmentClinicalNote[] | null
  >(null);
  const [areNotesVisible, setAreNotesVisible] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  let clinicalNotesButtonLabel: string;
  if (isLoadingNotes) {
    clinicalNotesButtonLabel = "Cargando nota…";
  } else if (areNotesVisible) {
    clinicalNotesButtonLabel = "Ocultar nota clínica";
  } else {
    clinicalNotesButtonLabel = "Ver nota clínica";
  }

  async function toggleClinicalNotes() {
    if (areNotesVisible) {
      setAreNotesVisible(false);
      return;
    }

    setAreNotesVisible(true);
    setNotesError(null);
    if (clinicalNotes !== null) return;

    setIsLoadingNotes(true);
    try {
      setClinicalNotes(
        await getAppointmentClinicalNotes(appointment.appId),
      );
    } catch (error: unknown) {
      setNotesError(
        error instanceof ApiError
          ? error.message
          : "No pudimos cargar la nota clínica. Intenta de nuevo.",
      );
      setAreNotesVisible(false);
    } finally {
      setIsLoadingNotes(false);
    }
  }

  return (
    <article className="flex flex-col rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold text-text-subtle">
          Cita #{appointment.appId}
        </span>
        <AppointmentStateBadge state={appointment.appState} />
      </div>

      <p className="mt-3 font-display text-lg font-bold text-text">
        {appointment.patientName}
      </p>
      {appointment.patientType === "dependent" && (
        <p className="text-xs text-text-muted">Menor de edad</p>
      )}

      <ul className="mt-4 space-y-2 text-xs text-text-muted">
        <li className="flex items-center gap-2">
          <Clock size={14} aria-hidden />
          {appointment.appDate
            ? formatDateTime(appointment.appDate)
            : "Sin fecha"}
        </li>
        <li className="flex items-center gap-2">
          <ModeIcon size={14} aria-hidden />
          {APPOINTMENT_MODE_LABELS[appointment.appType] ?? appointment.appType}
        </li>
      </ul>

      {appointment.appReason && (
        <div className="mt-4 rounded-xl bg-surface-muted px-3 py-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-text-subtle">
            <Lock size={12} aria-hidden />
            Motivo de consulta
          </p>
          <p className="mt-1 line-clamp-3 text-xs text-text-muted">
            {appointment.appReason}
          </p>
        </div>
      )}

      {canRecord && (
        <Link
          href={`/registro-atencion/nuevo?cita=${appointment.appId}`}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-white transition hover:bg-primary-dark"
        >
          <ClipboardCheck size={14} aria-hidden />
          Registrar atención
        </Link>
      )}

      {appointment.appState === "realizada" && (
        <div className="mt-5">
          <button
            type="button"
            onClick={toggleClinicalNotes}
            disabled={isLoadingNotes}
            aria-expanded={areNotesVisible}
            className="inline-flex items-center gap-2 rounded-full border border-primary px-5 py-2.5 text-xs font-bold text-primary transition hover:bg-primary-soft disabled:cursor-wait disabled:opacity-60"
          >
            <FileText size={14} aria-hidden />
            {clinicalNotesButtonLabel}
          </button>

          {notesError && (
            <p role="alert" className="mt-2 text-xs text-danger">
              {notesError}
            </p>
          )}

          {areNotesVisible && !isLoadingNotes && clinicalNotes && (
            <div className="mt-3 space-y-2">
              {clinicalNotes.length === 0 ? (
                <p className="rounded-xl bg-surface-muted p-3 text-xs text-text-subtle">
                  No hay notas clínicas registradas para esta cita.
                </p>
              ) : (
                clinicalNotes.map((note) => (
                  <section
                    key={note.cnId}
                    className="rounded-xl bg-surface-muted p-3"
                  >
                    <p className="text-xs font-semibold text-text-subtle">
                      Nota clínica · {formatDateTime(note.cnCreatedAt)}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-text">
                      {note.cnObservation || "Sin observación registrada."}
                    </p>
                  </section>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
"use client";

import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import {
  APPOINTMENT_STATE_LABELS,
  formatDateTime,
} from "@/features/appointments/lib/appointment-format";
import ConsultantHeader from "../components/consultant-header";
import { useConsultantRecord } from "../hooks/use-consultant-record";
import { getConsultantForPsychologist } from "../services/consultants-service";
import type {
  ConsultantAppointment,
  ConsultantFullRecord,
} from "../types/consultant-types";

type Props = {
  readonly consultantId: number;
};

/**
 * Displays the full record of a consultant for the authenticated psychologist.
 * @param param0 The props containing the consultant id.
 * @returns The consultant full record page.
 */
export default function ConsultantFullRecordPage({ consultantId }: Props) {
  const { record: consultant, isLoading, loadError } = useConsultantRecord<
    ConsultantFullRecord
  >(
    consultantId,
    getConsultantForPsychologist,
    "No tienes permisos para ver esta ficha, o no pudimos cargarla.",
  );
  const completedAppointments =
    consultant?.appointments.filter(
      (appointment) => appointment.state === "realizada",
    ) ?? [];
  const waitingAppointments =
    consultant?.appointments.filter(
      (appointment) => appointment.state !== "realizada",
    ) ?? [];

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
          </div>

          <AppointmentSection
            title="Citas realizadas"
            appointments={completedAppointments}
            emptyMessage="Todavía no hay citas realizadas."
          />

          <AppointmentSection
            title="Citas en espera"
            appointments={waitingAppointments}
            emptyMessage="No hay citas pendientes o confirmadas."
          />
        </div>
      )}
    </div>
  );
}

/**
 * Renders a section displaying a list of appointments for a consultant.
 * @param param0 The props containing the title, appointments, and empty message.
 * @returns The appointment section component.
 */
function AppointmentSection({
  title,
  appointments,
  emptyMessage,
}: {
  readonly title: string;
  readonly appointments: ConsultantAppointment[];
  readonly emptyMessage: string;
}) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold text-text">{title}</h2>
      {appointments.length === 0 ? (
        <p className="mt-3 text-sm text-text-subtle">{emptyMessage}</p>
      ) : (
        <div className="mt-3 space-y-3">
          {appointments.map((appointment) => (
            <article
              key={appointment.id}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-text">
                  {appointment.appDate
                    ? formatDateTime(appointment.appDate)
                    : "Fecha por definir"}
                </p>
                <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
                  {APPOINTMENT_STATE_LABELS[appointment.state]}
                </span>
              </div>
              {appointment.duration && (
                <p className="mt-1 text-xs text-text-subtle">
                  Duración: {appointment.duration} minutos
                </p>
              )}
              {appointment.reason && (
                <div className="mt-3 rounded-lg bg-surface-muted p-3">
                  <p className="flex items-center gap-2 text-xs font-semibold text-text-subtle">
                    <FileText size={14} aria-hidden />
                    Motivo de esta cita
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-text">
                    {appointment.reason}
                  </p>
                </div>
              )}
              {appointment.state === "realizada" &&
                (appointment.clinicalNotes.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {appointment.clinicalNotes.map((note) => (
                      <details
                        key={note.id}
                        className="rounded-lg border border-border bg-surface-muted px-3 py-2"
                      >
                        <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-primary">
                          <FileText size={14} aria-hidden />
                          Ver nota clínica
                        </summary>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-text">
                          {note.observation || "Sin observación registrada."}
                        </p>
                      </details>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-text-subtle">
                    No hay nota clínica registrada para esta cita.
                  </p>
                ))}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
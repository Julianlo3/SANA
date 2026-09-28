"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Video } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import { ApiError } from "@/types/api-types";
import AppointmentStateBadge from "../components/appointment-state-badge";
import {
  APPOINTMENT_MODE_LABELS,
  formatDate,
  formatDateTime,
} from "../lib/appointment-format";
import { listAppointments } from "../services/appointments-service";
import type {
  Appointment,
  AppointmentState,
} from "../types/appointment-types";

type Filter = AppointmentState | "todas";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "pendiente", label: "Pendientes" },
  { value: "asignada", label: "Asignadas" },
  { value: "confirmada", label: "Confirmadas" },
  { value: "descartada", label: "Descartadas" },
  { value: "todas", label: "Todas" },
];

/**
 * HU-2.3.1: bandeja de solicitudes de la asistente.
 * Muestra las solicitudes más recientes primero y nunca el motivo de consulta.
 */
export default function AppointmentsInboxPage() {
  const [filter, setFilter] = useState<Filter>("pendiente");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    listAppointments(filter === "todas" ? undefined : filter, controller.signal)
      .then((result) => setAppointments(result))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof ApiError
            ? error.message
            : "No pudimos cargar las solicitudes. Intenta de nuevo.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [filter]);

  function changeFilter(next: Filter) {
    if (next === filter) return;
    setFilter(next);
    setIsLoading(true);
    setLoadError(null);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl font-bold text-primary-dark">
        Solicitudes de cita
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        Revisa las solicitudes que llegan desde el sitio web, asígnalas a un
        psicólogo y confirma la cita.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => changeFilter(option.value)}
            aria-pressed={filter === option.value}
            className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
              filter === option.value
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-text-muted hover:border-primary hover:text-primary"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loadError && (
        <div className="mt-6">
          <InlineMessage tone="error">{loadError}</InlineMessage>
        </div>
      )}

      {isLoading && (
        <p className="mt-8 text-sm text-text-subtle">Cargando solicitudes…</p>
      )}

      {!isLoading && !loadError && (
        <div className="mt-6 space-y-3">
          {appointments.length === 0 ? (
            <p className="rounded-2xl border border-border bg-surface px-5 py-10 text-center text-sm text-text-subtle">
              No hay solicitudes en este estado.
            </p>
          ) : (
            appointments.map((appointment) => {
              const ModeIcon =
                appointment.appType === "virtual" ? Video : MapPin;

              return (
                <Link
                  key={appointment.appId}
                  href={`/solicitudes/${appointment.appId}`}
                  className="block rounded-xl border border-border bg-surface p-4 transition hover:border-primary"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-text">
                        {appointment.requesterName}
                      </p>
                      {appointment.patientType === "dependent" && (
                        <p className="text-xs text-text-muted">
                          Para el menor {appointment.patientName}
                        </p>
                      )}
                    </div>

                    <AppointmentStateBadge state={appointment.appState} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-text-subtle">
                    <span>Solicitud #{appointment.appId}</span>

                    <span className="inline-flex items-center gap-1">
                      <ModeIcon size={13} aria-hidden />
                      {APPOINTMENT_MODE_LABELS[appointment.appType] ??
                        appointment.appType}
                    </span>

                    <span>Recibida {formatDate(appointment.appCreatedAt)}</span>

                    {appointment.appDateIdeal && (
                      <span>
                        Prefiere {formatDate(appointment.appDateIdeal)}
                      </span>
                    )}

                    {appointment.appDate && (
                      <span>Cita: {formatDateTime(appointment.appDate)}</span>
                    )}

                    {appointment.psychologistName && (
                      <span>Con {appointment.psychologistName}</span>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}

      {!isLoading && !loadError && appointments.length > 0 && (
        <p className="mt-4 text-xs text-text-subtle">
          Mostrando {appointments.length}{" "}
          {appointments.length === 1 ? "solicitud" : "solicitudes"}
        </p>
      )}
    </div>
  );
}
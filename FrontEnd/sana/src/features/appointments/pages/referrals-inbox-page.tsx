"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock, GitBranch, MapPin, User, Video } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import { ApiError } from "@/types/api-types";
import AppointmentStateBadge from "../components/appointment-state-badge";
import {
  APPOINTMENT_MODE_LABELS,
  formatDate,
  formatDateTime,
} from "../lib/appointment-format";
import {
  listPendingReferrals,
  listPsychologistOptions,
} from "../services/appointments-service";
import type {
  Appointment,
  PsychologistOption,
  ReferralState,
} from "../types/appointment-types";

/** Filter tabs shown above the list. */
const FILTERS: { value: ReferralState; label: string; description: string }[] = [
  {
    value: "remitida",
    label: "Pendientes de horario",
    description: "Remisiones sin fecha asignada. Asigna horario según la disponibilidad del psicólogo destino.",
  },
  {
    value: "asignada",
    label: "Pendientes de confirmar",
    description: "Ya tienen horario provisional. Falta confirmar la cita.",
  },
];

const EMPTY_PSYCHOLOGISTS: PsychologistOption[] = [];

type ReferralLoadState =
  | { filter: ReferralState; status: "loading" }
  | {
      filter: ReferralState;
      status: "ready";
      referrals: Appointment[];
      psychologists: PsychologistOption[];
    }
  | { filter: ReferralState; status: "error"; error: string };

/**
 * Secretary view of referred valuation appointments pending schedule assignment.
 * Displays target psychologist information including their clinical specialization.
 * Uses GET /appointments/referrals?state=remitida|asignada.
 * @returns Rendered page.
 */
export default function ReferralsInboxPage() {
  const [filter, setFilter] = useState<ReferralState>("remitida");
  const [loadState, setLoadState] = useState<ReferralLoadState>({
    filter: "remitida",
    status: "loading",
  });

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      listPendingReferrals(filter, controller.signal),
      listPsychologistOptions(controller.signal),
    ])
      .then(([referralResults, psychologistResults]) => {
        if (!controller.signal.aborted) {
          setLoadState({
            filter,
            status: "ready",
            referrals: referralResults,
            psychologists: psychologistResults,
          });
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadState({
          filter,
          status: "error",
          error:
            error instanceof ApiError
              ? error.message
              : "No pudimos cargar las valoraciones remitidas. Intenta de nuevo.",
        });
      });

    return () => controller.abort();
  }, [filter]);

  const isCurrentLoad = loadState.filter === filter;
  const isLoading = !isCurrentLoad || loadState.status === "loading";
  const referrals =
    isCurrentLoad && loadState.status === "ready" ? loadState.referrals : [];
  const psychologists =
    isCurrentLoad && loadState.status === "ready"
      ? loadState.psychologists
      : EMPTY_PSYCHOLOGISTS;
  const loadError =
    isCurrentLoad && loadState.status === "error" ? loadState.error : null;

  const activeTab = FILTERS.find((f) => f.value === filter)!;

  const psychologistMap = useMemo(
    () => new Map<number, PsychologistOption>(psychologists.map((p) => [p.psyId, p])),
    [psychologists],
  );

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-start gap-3">
        <GitBranch
          size={28}
          className="mt-1 shrink-0 text-primary"
          aria-hidden
        />
        <div>
          <h1 className="font-display text-3xl font-bold text-primary-dark">
            Valoraciones remitidas
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Valoraciones que un psicólogo remitió a otro colega con su especialidad.
            Asigna horario según la disponibilidad del profesional destino y luego confírmalas.
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
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

      <p className="mt-2 text-xs text-text-subtle">{activeTab.description}</p>

      {loadError && (
        <div className="mt-6">
          <InlineMessage tone="error">{loadError}</InlineMessage>
        </div>
      )}

      {isLoading && (
        <p className="mt-8 text-sm text-text-subtle">
          Cargando valoraciones remitidas…
        </p>
      )}

      {!isLoading && !loadError && (
        <>
          {referrals.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-dashed border-border bg-surface px-5 py-10 text-center text-sm text-text-subtle">
              No hay valoraciones remitidas en este estado.
            </p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {referrals.map((appointment) => {
                const ModeIcon =
                  appointment.appType === "virtual" ? Video : MapPin;
                const targetPsychologist = appointment.psychologistId
                  ? psychologistMap.get(appointment.psychologistId)
                  : null;

                return (
                  <Link
                    key={appointment.appId}
                    href={`/solicitudes/${appointment.appId}`}
                    className="flex flex-col rounded-2xl border border-border bg-surface p-5 transition hover:border-primary hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs font-semibold text-text-subtle">
                        Valoración #{appointment.appId}
                      </span>
                      <AppointmentStateBadge state={appointment.appState} />
                    </div>

                    <p className="mt-3 truncate font-display text-lg font-bold text-text">
                      {appointment.requesterName}
                    </p>
                    {appointment.patientType === "dependent" && (
                      <p className="truncate text-xs text-text-muted">
                        Para el menor {appointment.patientName}
                      </p>
                    )}

                    <ul className="mt-4 space-y-2 text-xs text-text-muted">
                      <li className="flex items-center gap-2">
                        <ModeIcon size={14} aria-hidden />
                        {APPOINTMENT_MODE_LABELS[appointment.appType] ??
                          appointment.appType}
                      </li>
                      {appointment.psychologistName && (
                        <li className="flex items-start gap-2">
                          <User size={14} className="mt-0.5 shrink-0" aria-hidden />
                          <div>
                            <span>
                              Psicólogo destino:{" "}
                              <strong className="font-semibold text-text">
                                {appointment.psychologistName}
                              </strong>
                            </span>
                            {targetPsychologist?.speciality && (
                              <span className="block font-medium text-primary">
                                Especialidad: {targetPsychologist.speciality}
                              </span>
                            )}
                          </div>
                        </li>
                      )}
                      <li className="flex items-center gap-2">
                        <CalendarDays size={14} aria-hidden />
                        Remitida {formatDate(appointment.appCreatedAt)}
                      </li>
                      {appointment.appDate && (
                        <li className="flex items-center gap-2">
                          <Clock size={14} aria-hidden />
                          {formatDateTime(appointment.appDate)}
                        </li>
                      )}
                    </ul>
                  </Link>
                );
              })}
            </div>
          )}

          {referrals.length > 0 && (
            <p className="mt-4 text-xs text-text-subtle">
              Mostrando {referrals.length}{" "}
              {referrals.length === 1 ? "valoración" : "valoraciones"}
            </p>
          )}
        </>
      )}
    </div>
  );
}

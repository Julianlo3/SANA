"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  UserRound,
} from "lucide-react";
import Button from "@/components/ui/button";
import InlineMessage from "@/components/feedback/inline-message";
import { ApiError } from "@/types/api-types";
import {
  formatDate,
  isPlaceholderEmail,
} from "@/features/appointments/lib/appointment-format";
import { getAppointment } from "@/features/appointments/services/appointments-service";
import type { Appointment } from "@/features/appointments/types/appointment-types";
import {
  approveCarePackage,
  listCarePackages,
  listCarePackageSuggestions,
  rejectCarePackage,
} from "../services/care-packages-service";
import {
  MIN_CARE_PACKAGE_SESSIONS,
  MAX_CARE_PACKAGE_SESSIONS,
} from "../types/care-package-types";
import type {
  CarePackage,
  CarePackageState,
  PackagePriority,
} from "../types/care-package-types";

type PackageFilter = CarePackageState | "todas";

/** Filters for categorizing care packages */
const FILTERS: { value: PackageFilter; label: string }[] = [
  { value: "sugerido", label: "Por revisar" },
  { value: "activo", label: "Activos" },
  { value: "finalizado", label: "Finalizados" },
  { value: "rechazado", label: "Rechazados" },
  { value: "cancelado", label: "Cancelados" },
  { value: "todas", label: "Todos" },
];

/** Labels for each care package state */
const STATE_LABELS: Record<CarePackageState, string> = {
  sugerido: "Por revisar",
  activo: "Activo",
  rechazado: "Rechazado",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

/** Accent classes for each care package state */
const STATE_ACCENT_CLASSES: Record<CarePackageState, string> = {
  sugerido: "bg-accent",
  activo: "bg-success-soft",
  rechazado: "bg-border",
  finalizado: "bg-primary",
  cancelado: "bg-border",
};

/** Labels for each care package priority */
const PRIORITY_LABELS: Record<PackagePriority, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

/**
 * Displays persisted care packages for secretary review and tracking.
 * @returns The package management page.
 */
export default function CarePackageRequestsPage() {
  const [packages, setPackages] = useState<CarePackage[]>([]);
  const [contacts, setContacts] = useState<Record<number, Appointment>>({});
  const [contactErrors, setContactErrors] = useState<Record<number, string>>(
    {},
  );
  const [sessionLimits, setSessionLimits] = useState<Record<number, string>>({});
  const [priorities, setPriorities] = useState<Record<number, PackagePriority>>(
    {},
  );
  const [rejectionReasons, setRejectionReasons] = useState<
    Record<number, string>
  >({});
  const [filter, setFilter] = useState<PackageFilter>("sugerido");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      listCarePackages(controller.signal),
      listCarePackageSuggestions(controller.signal),
    ])
      .then(async ([result, suggestions]) => {
        if (controller.signal.aborted) return;
        const contactResults = await Promise.allSettled(
          suggestions.map((suggestion) =>
            getAppointment(suggestion.assessmentAppointmentId, controller.signal),
          ),
        );
        if (controller.signal.aborted) return;

        const suggestionById = new Map(
          suggestions.map((suggestion) => [suggestion.id, suggestion]),
        );
        setPackages(
          result.map((carePackage) => {
            const suggestion = suggestionById.get(carePackage.id);
            return suggestion
              ? {
                  ...carePackage,
                  priority: suggestion.priority,
                  sessionLimit: suggestion.sessionLimit,
                  suggestedPriority: suggestion.suggestedPriority,
                  suggestedSessionLimit: suggestion.suggestedSessionLimit,
                  suggestionComment: suggestion.suggestionComment,
                  noShowCount: suggestion.noShowCount,
                }
              : carePackage;
          }),
        );
        const nextContacts: Record<number, Appointment> = {};
        const nextContactErrors: Record<number, string> = {};
        contactResults.forEach((contactResult, index) => {
          const suggestion = suggestions[index];
          if (contactResult.status === "fulfilled") {
            nextContacts[suggestion.id] = contactResult.value;
          } else {
            nextContactErrors[suggestion.id] =
              contactResult.reason instanceof ApiError
                ? contactResult.reason.message
                : "No pudimos cargar los datos de contacto.";
          }
        });
        setContacts(nextContacts);
        setContactErrors(nextContactErrors);
        setSessionLimits(
          Object.fromEntries(
            result.map((carePackage) => {
              const suggestion = suggestionById.get(carePackage.id);
              return [
                carePackage.id,
                (
                  suggestion?.suggestedSessionLimit ??
                  suggestion?.sessionLimit ??
                  carePackage.suggestedSessionLimit ??
                  carePackage.sessionLimit
                ).toString(),
              ];
            }),
          ),
        );
        setPriorities(
          Object.fromEntries(
            result.map((carePackage) => {
              const suggestion = suggestionById.get(carePackage.id);
              return [
                carePackage.id,
                suggestion?.suggestedPriority ??
                  suggestion?.priority ??
                  carePackage.suggestedPriority ??
                  carePackage.priority,
              ];
            }),
          ),
        );
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof ApiError
            ? error.message
            : "No pudimos cargar los paquetes de atención.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [reloadKey]);

  /**
   * Reloads package records after a secretary decision.
   * @returns Nothing.
   */
  function reload() {
    setIsLoading(true);
    setLoadError(null);
    setReloadKey((key) => key + 1);
  }

  /**
   * Approves a suggested package using the edited session count and priority.
   * @param carePackage Suggested package to approve.
   * @returns A promise resolving when the decision finishes.
   */
  async function approve(carePackage: CarePackage) {
    const sessionLimit = Number(sessionLimits[carePackage.id]);
    if (!Number.isInteger(sessionLimit) || sessionLimit < MIN_CARE_PACKAGE_SESSIONS || sessionLimit > MAX_CARE_PACKAGE_SESSIONS) {
      setActionError(
        `Indica un número entero de citas entre ${MIN_CARE_PACKAGE_SESSIONS} y ${MAX_CARE_PACKAGE_SESSIONS}.`,
      );
      return;
    }

    setWorkingId(carePackage.id);
    setActionError(null);
    try {
      await approveCarePackage(carePackage.id, {
        sessionLimit,
        priority: priorities[carePackage.id],
      });
      reload();
    } catch (error: unknown) {
      setActionError(
        error instanceof ApiError
          ? error.message
          : "No pudimos aprobar el paquete. Intenta de nuevo.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  /**
   * Rejects a suggestion with the secretary's required explanation.
   * @param carePackage Suggested package to reject.
   * @returns A promise resolving when the decision finishes.
   */
  async function reject(carePackage: CarePackage) {
    const reason = rejectionReasons[carePackage.id]?.trim() ?? "";
    if (!reason) {
      setActionError("Escribe el motivo del rechazo.");
      return;
    }

    setWorkingId(carePackage.id);
    setActionError(null);
    try {
      await rejectCarePackage(carePackage.id, { reason });
      reload();
    } catch (error: unknown) {
      setActionError(
        error instanceof ApiError
          ? error.message
          : "No pudimos rechazar el paquete. Intenta de nuevo.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  const visiblePackages = useMemo(
    () =>
      packages.filter(
        (carePackage) =>
          filter === "todas" || carePackage.state === filter,
      ),
    [packages, filter],
  );

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-3xl font-bold text-primary-dark">
        Paquetes de atención
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        Revisa las sugerencias del psicólogo, ajusta sus condiciones y aprueba
        o rechaza cada paquete.
      </p>

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

      {loadError && (
        <div className="mt-6">
          <InlineMessage tone="error">{loadError}</InlineMessage>
        </div>
      )}
      {actionError && (
        <div className="mt-6">
          <InlineMessage tone="error">{actionError}</InlineMessage>
        </div>
      )}

      {isLoading && (
        <p className="mt-8 text-sm text-text-subtle">
          Cargando paquetes de atención…
        </p>
      )}

      {!isLoading && !loadError && visiblePackages.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-border bg-surface px-5 py-10 text-center text-sm text-text-subtle">
          No hay paquetes para este filtro.
        </p>
      )}

      {!isLoading && !loadError && visiblePackages.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visiblePackages.map((carePackage) => {
            const isSuggested = carePackage.state === "sugerido";
            const isWorking = workingId === carePackage.id;
            return (
            <article
              key={carePackage.id}
              className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
            >
              <div
                aria-hidden
                className={`h-1.5 ${STATE_ACCENT_CLASSES[carePackage.state]}`}
              />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-text-subtle">
                      Paquete #{carePackage.id}
                    </p>
                    <h2 className="mt-1 font-display text-xl font-bold text-text">
                      {carePackage.patientName}
                    </h2>
                  </div>
                  <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary-dark">
                    {STATE_LABELS[carePackage.state]}
                  </span>
                </div>

                <ul className="mt-4 space-y-3 text-sm text-text-muted">
                  <li className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 size={15} aria-hidden />
                      Prioridad
                    </span>
                    <span className="font-semibold text-text">
                      {PRIORITY_LABELS[
                        isSuggested
                          ? carePackage.suggestedPriority ??
                              carePackage.priority
                          : carePackage.priority
                      ]}
                    </span>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <CalendarDays size={15} aria-hidden />
                      Sesiones realizadas
                    </span>
                    <span className="font-semibold text-text">
                      {carePackage.completedSessions}/
                      {isSuggested
                        ? carePackage.suggestedSessionLimit ??
                          carePackage.sessionLimit
                        : carePackage.sessionLimit}
                    </span>
                  </li>
                  <li className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <Clock3 size={15} aria-hidden />
                      Reservadas
                    </span>
                    <span className="font-semibold text-text">
                      {carePackage.reservedSessions}
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <UserRound size={15} aria-hidden />
                    {carePackage.psychologistName ?? "Sin asignar"}
                  </li>
                  <li className="text-xs text-text-subtle">
                    Creado {formatDate(carePackage.createdAt)}
                  </li>
                  {carePackage.closedAt && (
                    <li className="text-xs text-text-subtle">
                      Cerrado {formatDate(carePackage.closedAt)}
                    </li>
                  )}
                  {carePackage.suggestionComment && (
                    <li className="rounded-lg bg-surface-muted px-3 py-2 text-xs">
                      Nota del psicólogo: {carePackage.suggestionComment}
                    </li>
                  )}
                  {carePackage.noShowCount !== undefined && (
                    <li className="text-xs text-text-subtle">
                      Inasistencias previas: {carePackage.noShowCount}
                    </li>
                  )}
                  {isSuggested && contacts[carePackage.id] && (
                    <li className="rounded-lg border border-border px-3 py-2 text-xs">
                      <p className="font-semibold text-text">
                        Contacto del solicitante
                        {contacts[carePackage.id].patientType === "dependent"
                          ? " (acudiente)"
                          : ""}
                      </p>
                      <p className="mt-1">
                        Teléfono:{" "}
                        {contacts[carePackage.id].requesterContactNumber ??
                          "No registrado"}
                      </p>
                      <p>
                        Correo:{" "}
                        {isPlaceholderEmail(
                          contacts[carePackage.id].requesterEmail,
                        )
                          ? "No registrado"
                          : contacts[carePackage.id].requesterEmail ??
                            "No registrado"}
                      </p>
                    </li>
                  )}
                  {isSuggested && contactErrors[carePackage.id] && (
                    <li className="text-xs text-danger">
                      {contactErrors[carePackage.id]}
                    </li>
                  )}
                  {carePackage.rejectionReason && (
                    <li className="rounded-lg bg-danger/5 px-3 py-2 text-xs text-danger">
                      Motivo del rechazo: {carePackage.rejectionReason}
                    </li>
                  )}
                </ul>

                {isSuggested && (
                  <div className="mt-5 space-y-4 border-t border-border pt-4">
                    <label className="block">
                      <span className="text-sm font-semibold text-text">
                        Número de citas del paquete
                      </span>
                      <input
                        type="number"
                        min={MIN_CARE_PACKAGE_SESSIONS} max={MAX_CARE_PACKAGE_SESSIONS}
                        step={1}
                        value={sessionLimits[carePackage.id] ?? ""}
                        disabled={isWorking}
                        onChange={(event) =>
                          setSessionLimits((current) => ({
                            ...current,
                            [carePackage.id]: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-text">
                        Prioridad
                      </span>
                      <select
                        value={priorities[carePackage.id] ?? carePackage.priority}
                        disabled={isWorking}
                        onChange={(event) => {
                          const value = event.target.value;
                          if (
                            value === "alta" ||
                            value === "media" ||
                            value === "baja"
                          ) {
                            setPriorities((current) => ({
                              ...current,
                              [carePackage.id]: value,
                            }));
                          }
                        }}
                        className="mt-2 w-full cursor-pointer rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed"
                      >
                        <option value="alta">Alta</option>
                        <option value="media">Media</option>
                        <option value="baja">Baja</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="text-sm font-semibold text-text">
                        Motivo del rechazo
                      </span>
                      <textarea
                        rows={2}
                        maxLength={1000}
                        value={rejectionReasons[carePackage.id] ?? ""}
                        disabled={isWorking}
                        onChange={(event) =>
                          setRejectionReasons((current) => ({
                            ...current,
                            [carePackage.id]: event.target.value,
                          }))
                        }
                        className="mt-2 w-full resize-y rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed"
                      />
                    </label>

                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() => approve(carePackage)}
                        disabled={isWorking}
                      >
                        {isWorking ? "Guardando…" : "Aprobar paquete"}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => reject(carePackage)}
                        disabled={isWorking}
                      >
                        Rechazar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

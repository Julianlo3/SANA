"use client";

import { useEffect, useState } from "react";
import { Mail, Phone, UserRound } from "lucide-react";
import Button from "@/components/ui/button";
import InlineMessage from "@/components/feedback/inline-message";
import { ApiError } from "@/types/api-types";
import {
  createCarePackage,
  listCarePackageRequests,
  rejectCarePackageRequest,
} from "../services/care-packages-service";
import type {
  CarePackageRequest,
  PackagePriority,
} from "../types/care-package-types";

const PRIORITY_LABELS: Record<PackagePriority, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

/**
 * Allows the secretary to review, edit and decide on psychologist package suggestions.
 * @returns The secretary's package suggestion inbox.
 */
export default function CarePackageRequestsPage() {
  const [requests, setRequests] = useState<CarePackageRequest[]>([]);
  const [sessionLimits, setSessionLimits] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    listCarePackageRequests(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setRequests(result);
        setSessionLimits(
          Object.fromEntries(
            result.map((request) => [
              request.assessmentAppointmentId,
              request.suggestedSessionLimit?.toString() ?? "",
            ]),
          ),
        );
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof ApiError
            ? error.message
            : "No pudimos cargar las solicitudes de paquetes.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [reloadKey]);

  /**
   * Reloads the suggestion queue after a decision.
   * @returns Nothing.
   */
  function reload() {
    setIsLoading(true);
    setLoadError(null);
    setReloadKey((key) => key + 1);
  }

  /**
   * Creates the package using the edited session count.
   * @param request Package suggestion to approve.
   * @returns A promise that resolves when approval finishes.
   */
  async function approve(request: CarePackageRequest) {
    const sessionLimit = Number(
      sessionLimits[request.assessmentAppointmentId],
    );
    if (!Number.isInteger(sessionLimit) || sessionLimit < 1) {
      setActionError("Indica un número entero de citas mayor que cero.");
      return;
    }

    setWorkingId(request.assessmentAppointmentId);
    setActionError(null);
    try {
      await createCarePackage({
        assessmentAppointmentId: request.assessmentAppointmentId,
        sessionLimit,
        priority: request.priority,
      });
      reload();
    } catch (error: unknown) {
      setActionError(
        error instanceof ApiError
          ? error.message
          : "No pudimos confirmar el paquete. Intenta de nuevo.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  /**
   * Rejects the selected package suggestion.
   * @param request Package suggestion to reject.
   * @returns A promise that resolves when rejection finishes.
   */
  async function reject(request: CarePackageRequest) {
    setWorkingId(request.assessmentAppointmentId);
    setActionError(null);
    try {
      await rejectCarePackageRequest(request.assessmentAppointmentId);
      reload();
    } catch (error: unknown) {
      setActionError(
        error instanceof ApiError
          ? error.message
          : "No pudimos rechazar la sugerencia. Intenta de nuevo.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-3xl font-bold text-primary-dark">
        Solicitudes de paquetes
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        Revisa la prioridad y la recomendación del psicólogo. Puedes ajustar el
        número de citas antes de confirmar el paquete.
      </p>

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
          Cargando solicitudes de paquetes…
        </p>
      )}
      {!isLoading && !loadError && requests.length === 0 && (
        <p className="mt-6 rounded-2xl border border-dashed border-border bg-surface px-5 py-10 text-center text-sm text-text-subtle">
          No hay sugerencias pendientes de revisión.
        </p>
      )}
      {!isLoading && !loadError && requests.length > 0 && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {requests.map((request) => {
            const busy = workingId === request.assessmentAppointmentId;
            return (
              <article
                key={request.assessmentAppointmentId}
                className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-text-subtle">
                      Valoración #{request.assessmentAppointmentId}
                    </p>
                    <h2 className="mt-1 font-display text-xl font-bold text-text">
                      {request.patientName}
                    </h2>
                    {request.patientType === "dependent" && (
                      <p className="text-xs text-text-muted">
                        Solicitud realizada por {request.requesterName}
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary-dark">
                    Prioridad {PRIORITY_LABELS[request.priority]}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-text-muted">
                  <p className="flex items-center gap-2">
                    <UserRound size={15} aria-hidden />
                    {request.requesterName}
                  </p>
                  {request.requesterContactNumber && (
                    <p className="flex items-center gap-2">
                      <Phone size={15} aria-hidden />
                      {request.requesterContactNumber}
                    </p>
                  )}
                  {request.requesterEmail && (
                    <p className="flex items-center gap-2 break-all">
                      <Mail size={15} aria-hidden />
                      {request.requesterEmail}
                    </p>
                  )}
                </div>

                <label className="mt-5 block">
                  <span className="text-sm font-semibold text-text">
                    Número de citas del paquete
                  </span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={sessionLimits[request.assessmentAppointmentId] ?? ""}
                    disabled={busy}
                    onChange={(event) =>
                      setSessionLimits((current) => ({
                        ...current,
                        [request.assessmentAppointmentId]: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed"
                  />
                  {request.suggestedSessionLimit === null && (
                    <span className="mt-1.5 block text-xs text-text-subtle">
                      El psicólogo no sugirió una cantidad; define una para
                      confirmar.
                    </span>
                  )}
                </label>

                <div className="mt-5 flex flex-wrap gap-3 border-t border-border pt-4">
                  <Button onClick={() => approve(request)} disabled={busy}>
                    {busy ? "Guardando…" : "Confirmar paquete"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => reject(request)}
                    disabled={busy}
                  >
                    Rechazar sugerencia
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

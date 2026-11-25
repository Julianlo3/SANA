"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Clock3, PackageCheck } from "lucide-react";
import { formatDateTime } from "@/features/appointments/lib/appointment-format";
import InlineMessage from "@/components/feedback/inline-message";
import { ApiError } from "@/types/api-types";
import { listMyRequests } from "@/features/my-account/services/my-account-service";
import { MY_REQUESTS_UPDATED_EVENT } from "@/features/my-account/lib/my-requests-events";
import type { MyRequest } from "@/features/my-account/types/my-account-types";
import CarePackageBooking from "./care-package-booking";
import { listMyCarePackages } from "../services/care-packages-service";
import { getFollowUpValuationRestriction } from "../lib/follow-up-valuation-eligibility";
import type { CarePackage } from "../types/care-package-types";

const PACKAGE_STATE_LABELS: Record<CarePackage["state"], string> = {
  sugerido: "Pendiente de aprobación",
  activo: "Activo",
  rechazado: "No aprobado",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

const PACKAGE_STATE_BADGE_CLASSES: Record<CarePackage["state"], string> = {
  sugerido: "bg-highlight text-navy",
  activo: "bg-success-soft text-primary-dark",
  rechazado: "bg-danger-soft text-danger",
  finalizado: "bg-surface-muted text-text-muted",
  cancelado: "bg-accent-soft text-accent-strong",
};

/**
 * Displays care packages, their appointments and session progress.
 * @returns The signed-in consultant's active package section.
 */
export default function MyCarePackagesSection() {
  const [packages, setPackages] = useState<CarePackage[]>([]);
  const [requests, setRequests] = useState<MyRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [bookingPackageId, setBookingPackageId] = useState<number | null>(null);
  const [bookingNotice, setBookingNotice] = useState<string | null>(null);

  /**
   * Reloads packages and appointments after a successful booking.
   * @returns Nothing.
   */
  const reload = useCallback(() => {
    setIsLoading(true);
    setLoadError(null);
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      listMyCarePackages(controller.signal),
      listMyRequests(controller.signal),
    ])
      .then(([packageResult, appointmentResult]) => {
        if (controller.signal.aborted) return;
        setPackages(packageResult);
        setRequests(appointmentResult);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof ApiError
            ? error.message
            : "No pudimos cargar tus paquetes de atención.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [reloadKey]);

  const activePackages = packages.filter(
    (carePackage) => carePackage.state === "activo",
  );
  const otherPackages = packages.filter(
    (carePackage) => carePackage.state !== "activo",
  );

  /**
   * Renders a package and its appointment actions.
   * @param carePackage Package to display.
   * @returns The package card.
   */
  function renderPackageCard(carePackage: CarePackage) {
    const appointments = requests
      .filter((request) => request.carePackageId === carePackage.id)
      .sort((left, right) =>
        (left.appDate ?? "").localeCompare(right.appDate ?? ""),
      );
    const occupiedCount =
      carePackage.completedSessions + carePackage.reservedSessions;
    const canBook = carePackage.state === "activo";
    const followUpRestriction = getFollowUpValuationRestriction(
      carePackage,
      packages,
      requests,
    );
    const canBookFollowUp =
      carePackage.state === "finalizado" && followUpRestriction === null;
    const isBookingOpen = bookingPackageId === carePackage.id;
    let bookingButtonLabel = "Solicitar una cita";
    if (canBookFollowUp) {
      bookingButtonLabel = "Solicitar nueva valoración";
    }
    if (isBookingOpen) {
      bookingButtonLabel = "Cerrar calendario";
    }
    const bookingNoticeText = canBookFollowUp
      ? "Tu valoración de continuidad quedó agendada con el psicólogo tratante."
      : "Tu cita del paquete fue registrada.";

    return (
      <article
        key={carePackage.id}
        className="rounded-2xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              Paquete #{carePackage.id}
            </p>
            <p className="mt-1 text-sm font-medium text-text-muted">
              {carePackage.patientType === "dependent"
                ? "Dependiente"
                : "Consultante"}
              : {carePackage.patientName}
            </p>
            <p
              className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${PACKAGE_STATE_BADGE_CLASSES[carePackage.state]}`}
            >
              {PACKAGE_STATE_LABELS[carePackage.state]}
            </p>
            {carePackage.psychologistName && (
              <p className="mt-1 text-sm text-text-muted">
                Psicólogo: {carePackage.psychologistName}
              </p>
            )}
          </div>
          <p className="rounded-full bg-primary-soft px-4 py-2 text-sm font-bold text-primary-dark">
            {carePackage.completedSessions}/{carePackage.sessionLimit} citas
            realizadas
          </p>
        </div>

        {carePackage.state === "sugerido" && (
          <p className="mt-4 rounded-xl border border-border bg-surface-muted/50 px-4 py-3 text-sm text-text-muted">
            El psicólogo sugirió este paquete. La secretaría debe revisarlo
            antes de que puedas agendar citas.
          </p>
        )}
        {carePackage.state === "rechazado" &&
          carePackage.rejectionReason && (
            <p className="mt-4 rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
              Motivo: {carePackage.rejectionReason}
            </p>
          )}

        {appointments.length > 0 ? (
          <ul className="mt-5 divide-y divide-border rounded-xl border border-border">
            {appointments.map((appointment) => (
              <li
                key={appointment.appId}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <span className="flex items-center gap-2 font-medium text-text">
                  <CalendarDays size={15} aria-hidden />
                  Cita #{appointment.appId}
                </span>
                <span className="flex items-center gap-2 text-text-muted">
                  <Clock3 size={15} aria-hidden />
                  {appointment.appDate
                    ? formatDateTime(appointment.appDate)
                    : "Pendiente de asignación"}
                </span>
                <span className="text-xs capitalize text-text-subtle">
                  {appointment.appState}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-text-muted">
            Aún no has solicitado sesiones para este paquete.
          </p>
        )}

        {canBook && occupiedCount >= carePackage.sessionLimit && (
          <p className="mt-5 text-sm font-medium text-text-muted">
            Ya alcanzaste el número de citas de este paquete.
          </p>
        )}
        {carePackage.state === "finalizado" && followUpRestriction && (
          <p className="mt-5 rounded-xl border border-border bg-surface-muted/50 px-4 py-3 text-sm text-text-muted">
            {followUpRestriction}
          </p>
        )}
        {(canBookFollowUp ||
          (canBook && occupiedCount < carePackage.sessionLimit)) && (
          <>
            <button
              type="button"
              aria-expanded={isBookingOpen}
              onClick={() =>
                setBookingPackageId((current) =>
                  current === carePackage.id ? null : carePackage.id,
                )
              }
              className="mt-5 rounded-xl border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary-soft"
            >
              {bookingButtonLabel}
            </button>
            {isBookingOpen && (
              <CarePackageBooking
                carePackage={carePackage}
                followUpValuation={canBookFollowUp}
                onBooked={() => {
                  setBookingPackageId(null);
                  window.dispatchEvent(new Event(MY_REQUESTS_UPDATED_EVENT));
                  setBookingNotice(bookingNoticeText);
                  reload();
                }}
              />
            )}
          </>
        )}
      </article>
    );
  }

  return (
    <section
      id="mis-paquetes"
      aria-labelledby="my-care-packages-heading"
      className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-7"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <PackageCheck size={20} aria-hidden />
        </span>
        <div>
          <h2
            id="my-care-packages-heading"
            className="font-display text-2xl font-bold text-primary-dark"
          >
            Mis paquetes de atención
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Consulta el estado de tus paquetes, el avance de las sesiones y
            solicita sesiones cuando estén activos o una valoración de
            continuidad con el psicólogo tratante al finalizar un paquete.
          </p>
        </div>
      </div>

      {loadError && (
        <div className="mt-5">
          <InlineMessage tone="error">{loadError}</InlineMessage>
        </div>
      )}
      {bookingNotice && (
        <div className="mt-5">
          <InlineMessage tone="success">{bookingNotice}</InlineMessage>
        </div>
      )}

      {isLoading && (
        <p className="mt-5 text-sm text-text-subtle">Cargando tus paquetes…</p>
      )}

      {!isLoading && !loadError && (
        packages.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed border-border bg-surface px-5 py-8 text-center text-sm text-text-subtle">
            Aún no tienes paquetes de atención. Cuando la secretaría revise una
            sugerencia, aparecerá aquí.
          </p>
        ) : (
          <div className="mt-5 space-y-6">
            <section aria-labelledby="active-care-packages-heading">
              <h3
                id="active-care-packages-heading"
                className="mb-4 text-lg font-bold text-primary-dark"
              >
                Paquetes activos
              </h3>
              {activePackages.length > 0 ? (
                <div className="space-y-5">
                  {activePackages.map(renderPackageCard)}
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-border bg-surface px-5 py-6 text-center text-sm text-text-subtle">
                  No tienes paquetes activos en este momento.
                </p>
              )}
            </section>

            {otherPackages.length > 0 && (
              <details className="rounded-2xl border border-border bg-surface-muted/40">
                <summary className="cursor-pointer rounded-2xl px-5 py-4 font-semibold text-primary-dark transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary marker:text-primary">
                  Otros paquetes ({otherPackages.length})
                </summary>
                <div className="space-y-5 border-t border-border p-5">
                  {otherPackages.map(renderPackageCard)}
                </div>
              </details>
            )}
          </div>
        )
      )}
    </section>
  );
}

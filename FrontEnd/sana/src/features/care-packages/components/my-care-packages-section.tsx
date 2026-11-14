"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Clock3, PackageCheck } from "lucide-react";
import { formatDateTime } from "@/features/appointments/lib/appointment-format";
import InlineMessage from "@/components/feedback/inline-message";
import { ApiError } from "@/types/api-types";
import { listMyRequests } from "@/features/my-account/services/my-account-service";
import type { MyRequest } from "@/features/my-account/types/my-account-types";
import CarePackageBooking from "./care-package-booking";
import { listMyCarePackages } from "../services/care-packages-service";
import type { CarePackage, PackagePriority } from "../types/care-package-types";

const PRIORITY_LABELS: Record<PackagePriority, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

/**
 * Displays active care packages, their appointments and session progress.
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

  const visiblePackages = packages.filter(
    (carePackage) => carePackage.state === "activo",
  );

  return (
    <section id="mis-paquetes">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <PackageCheck size={20} aria-hidden />
        </span>
        <div>
          <h2 className="font-display text-2xl font-bold text-primary-dark">
            Mis paquetes de atención
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Consulta tus sesiones y solicita una cita disponible.
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
        visiblePackages.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed border-border bg-surface px-5 py-8 text-center text-sm text-text-subtle">
            Aún no tienes paquetes activos. Cuando la secretaría confirme uno,
            aparecerá aquí.
          </p>
        ) : (
          <div className="mt-5 space-y-5">
            {visiblePackages.map((carePackage) => {
              const appointments = requests
                .filter(
                  (request) =>
                    request.carePackageId === carePackage.id,
                )
                .sort((left, right) =>
                  (left.appDate ?? "").localeCompare(right.appDate ?? ""),
                );
              const completedCount = appointments.filter(
                (request) => request.appState === "realizada",
              ).length;
              const occupiedCount = appointments.filter((request) =>
                ["realizada", "asignada", "confirmada"].includes(
                  request.appState,
                ),
              ).length;

              return (
                <article
                  key={carePackage.id}
                  className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-primary">
                        Paquete #{carePackage.id}
                      </p>
                      <h3 className="mt-1 font-display text-xl font-bold text-text">
                        Prioridad {PRIORITY_LABELS[carePackage.priority].toLowerCase()}
                      </h3>
                      {carePackage.psychologistName && (
                        <p className="mt-1 text-sm text-text-muted">
                          Psicólogo: {carePackage.psychologistName}
                        </p>
                      )}
                    </div>
                    <p className="rounded-full bg-primary-soft px-4 py-2 text-sm font-bold text-primary-dark">
                      {completedCount}/{carePackage.sessionLimit} citas realizadas
                    </p>
                  </div>

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

                  {occupiedCount < carePackage.sessionLimit && (
                    <>
                      <button
                        type="button"
                        aria-expanded={bookingPackageId === carePackage.id}
                        onClick={() =>
                          setBookingPackageId((current) =>
                            current === carePackage.id
                              ? null
                              : carePackage.id,
                          )
                        }
                        className="mt-5 rounded-xl border border-primary px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary-soft"
                      >
                        {bookingPackageId === carePackage.id
                          ? "Cerrar calendario"
                          : "Solicitar una cita"}
                      </button>
                      {bookingPackageId === carePackage.id && (
                        <CarePackageBooking
                          carePackage={carePackage}
                          onBooked={() => {
                            setBookingPackageId(null);
                            setBookingNotice(
                              "Tu cita del paquete fue registrada.",
                            );
                            reload();
                          }}
                        />
                      )}
                    </>
                  )}
                </article>
              );
            })}
          </div>
        )
      )}
    </section>
  );
}

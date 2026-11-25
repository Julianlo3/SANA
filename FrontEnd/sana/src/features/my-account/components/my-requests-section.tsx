"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  HeartHandshake,
  UsersRound,
  UserPlus,
} from "lucide-react";
import Button from "@/components/ui/button";
import InlineMessage from "@/components/feedback/inline-message";
import { listMyCarePackages } from "@/features/care-packages/services/care-packages-service";
import type { CarePackage } from "@/features/care-packages/types/care-package-types";
import { ApiError } from "@/types/api-types";
import CancelRequestDialog from "../components/cancel-request-dialog";
import NewDependentRequestDialog from "../components/new-dependent-request-dialog";
import NewRequestDialog from "../components/new-request-dialog";
import RequestCard from "../components/request-card";
import { useMyRequests } from "../hooks/use-my-requests";
import { useOwnProfile } from "../hooks/use-own-profile";
import {
  hasActiveSelfCarePackage,
  hasSelfPackageRequiringPackageFlow,
} from "../lib/appointment-request-eligibility";
import { MY_REQUESTS_UPDATED_EVENT } from "../lib/my-requests-events";
import type { MyRequest } from "../types/my-account-types";

/**
 * Set of appointment states considered "active" for the purpose of displaying them in the active appointments section.
 */
const ACTIVE_STATES = new Set([
  "pendiente",
  "asignada",
  "confirmada",
  "remitida",
]);
/**
 * Number of appointments to display per page in the "My Requests" section.
 */
const APPOINTMENTS_PER_PAGE = 4;
/**
 * Filter value representing all patients in the "My Requests" section.
 */
const ALL_PATIENTS_FILTER = "all";
/**
 * Filter value representing the current user (self) in the "My Requests" section.
 */
const SELF_PATIENT_FILTER = "self";

/**
 * Type representing the possible patient filters in the "My Requests" section. It can be "all" for all patients, "self" for the current user, or "dependent:<name>" for a specific dependent.
 */
type PatientFilter =
  | typeof ALL_PATIENTS_FILTER
  | typeof SELF_PATIENT_FILTER
  | `dependent:${string}`;

/**
 * Checks whether a select value identifies a supported patient filter.
 * @param value Candidate filter value.
 * @returns Whether the value is a supported patient filter.
 */
function isPatientFilter(value: string): value is PatientFilter {
  return (
    value === ALL_PATIENTS_FILTER ||
    value === SELF_PATIENT_FILTER ||
    value.startsWith("dependent:")
  );
}

/**
 * Orders appointments by creation date, newest first. Used as a tiebreaker for other comparators.
 * @param left First appointment.
 * @param right Second appointment.
 * @returns A comparator result.
 */
function compareByCreatedAt(left: MyRequest, right: MyRequest): number {
  return right.appCreatedAt.localeCompare(left.appCreatedAt);
}

/**
 * Orders active appointments by scheduled date, with undated appointments first.
 * @param left First appointment.
 * @param right Second appointment.
 * @returns A comparator result.
 */
function compareActiveAppointments(left: MyRequest, right: MyRequest): number {
  if (left.appDate === null && right.appDate !== null) return -1;
  if (left.appDate !== null && right.appDate === null) return 1;

  const dateOrder =
    left.appDate && right.appDate
      ? Date.parse(left.appDate) - Date.parse(right.appDate)
      : 0;
  return dateOrder || compareByCreatedAt(left, right);
}

/**
 * Orders historical appointments by scheduled date, newest first. Undated appointments are ordered by creation date.
 * @param left First appointment.
 * @param right Second appointment.
 * @returns A comparator result.
 */
function compareHistoricalAppointments(
  left: MyRequest,
  right: MyRequest,
): number {
  const leftDate = Date.parse(left.appDate ?? left.appCreatedAt);
  const rightDate = Date.parse(right.appDate ?? right.appCreatedAt);
  return rightDate - leftDate || compareByCreatedAt(left, right);
}

/**
 * Sorts active appointments before history, then orders each group by relevance.
 * @param left First appointment.
 * @param right Second appointment.
 * @returns A comparator result.
 */
function compareAppointments(left: MyRequest, right: MyRequest): number {
  const leftIsActive = ACTIVE_STATES.has(left.appState);
  const rightIsActive = ACTIVE_STATES.has(right.appState);

  if (leftIsActive !== rightIsActive) return leftIsActive ? -1 : 1;
  return leftIsActive
    ? compareActiveAppointments(left, right)
    : compareHistoricalAppointments(left, right);
}

/**
 * Helper function to generate an active summary message based on the number of active appointments.
 * @param count The number of active appointments.
 * @returns The active summary message.
 */
function activeSummary(count: number): string {
  if (count === 0) return "No tienes citas activas por ahora.";
  if (count === 1) return "Tienes 1 cita activa.";
  return `Tienes ${count} citas activas.`;
}

/**
 * Renders the "My Requests" section of the user account page, displaying active and historical appointment requests, along with options to create new requests or cancel existing ones.
 * @returns The JSX element representing the "My Requests" section.
 */
export default function MyRequestsSection() {
  const profile = useOwnProfile();
  const requests = useMyRequests();
  const { reload: reloadRequests } = requests;
  const [requestToCancel, setRequestToCancel] = useState<MyRequest | null>(
    null,
  );
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [isNewDependentRequestOpen, setIsNewDependentRequestOpen] =
    useState(false);
  const [patientFilter, setPatientFilter] =
    useState<PatientFilter>(ALL_PATIENTS_FILTER);
  const [appointmentPage, setAppointmentPage] = useState(0);
  const [packages, setPackages] = useState<CarePackage[]>([]);
  const [arePackagesLoading, setArePackagesLoading] = useState(true);
  const [packagesLoadError, setPackagesLoadError] = useState<string | null>(
    null,
  );
  const [packagesReloadKey, setPackagesReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    listMyCarePackages(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setPackages(result);
        setPackagesLoadError(null);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setPackages([]);
        setPackagesLoadError(
          error instanceof ApiError
            ? error.message
            : "No pudimos verificar tus paquetes de atención.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setArePackagesLoading(false);
      });

    return () => controller.abort();
  }, [packagesReloadKey]);

  useEffect(() => {
    const handleRequestsUpdated = () =>
      reloadRequests("Tus citas se actualizaron.");
    window.addEventListener(MY_REQUESTS_UPDATED_EVENT, handleRequestsUpdated);

    return () =>
      window.removeEventListener(
        MY_REQUESTS_UPDATED_EVENT,
        handleRequestsUpdated,
      );
  }, [reloadRequests]);

  const firstName = profile.profile?.fullName.trim().split(" ")[0] ?? "";
  const selfHasActivePackage = hasActiveSelfCarePackage(packages);
  const selfHasFinalizedPackage = packages.some(
    (carePackage) =>
      carePackage.patientType === "self" &&
      carePackage.state === "finalizado",
  );
  const selfNeedsPackageFlow =
    hasSelfPackageRequiringPackageFlow(packages);
  const isSelfRequestDisabled =
    !profile.profile ||
    arePackagesLoading ||
    packagesLoadError !== null ||
    selfNeedsPackageFlow;
  let dependentRequestDescriptionId: string | undefined;
  if (arePackagesLoading) {
    dependentRequestDescriptionId = "self-request-package-loading";
  } else if (packagesLoadError) {
    dependentRequestDescriptionId = "self-request-package-error";
  }
  let selfRequestDescriptionId: string | undefined;
  if (selfHasActivePackage) {
    selfRequestDescriptionId = "self-request-package-notice";
  } else if (selfHasFinalizedPackage) {
    selfRequestDescriptionId = "self-request-follow-up-notice";
  } else if (arePackagesLoading) {
    selfRequestDescriptionId = "self-request-package-loading";
  } else if (packagesLoadError) {
    selfRequestDescriptionId = "self-request-package-error";
  }
  const activeCount = requests.requests.filter((r) =>
    ACTIVE_STATES.has(r.appState),
  ).length;
  const dependentNames = [
    ...new Set(
      requests.requests
        .filter((request) => request.patientType === "dependent")
        .map((request) => request.patientName),
    ),
  ].sort((left, right) => left.localeCompare(right, "es"));
  const filteredRequests = requests.requests
    .filter((request) => {
      if (patientFilter === SELF_PATIENT_FILTER) {
        return request.patientType === "self";
      }
      if (patientFilter.startsWith("dependent:")) {
        return (
          request.patientType === "dependent" &&
          request.patientName === patientFilter.slice("dependent:".length)
        );
      }
      return true;
    })
    .sort(compareAppointments);
  const pageCount = Math.ceil(filteredRequests.length / APPOINTMENTS_PER_PAGE);
  const currentPage = Math.min(
    appointmentPage,
    Math.max(pageCount - 1, 0),
  );
  const pageRequests = filteredRequests.slice(
    currentPage * APPOINTMENTS_PER_PAGE,
    (currentPage + 1) * APPOINTMENTS_PER_PAGE,
  );

  /**
   * Retries the package lookup used to enable self valuation requests.
   * @returns Nothing.
   */
  const reloadPackages = useCallback(() => {
    setArePackagesLoading(true);
    setPackagesLoadError(null);
    setPackagesReloadKey((key) => key + 1);
  }, []);

  /**
   * Helper function to confirm the cancellation of a request.
   * @returns void
   */
  async function confirmCancel() {
    if (!requestToCancel) return;
    await requests.cancel(requestToCancel);
    setRequestToCancel(null);
  }

  /**
   * Closes request dialogs and refreshes the request list.
   * @param notice Success message displayed after submission.
   * @returns Nothing.
   */
  function handleCreated(
    notice = "Tu solicitud fue enviada. Una asistente te contactará para confirmar la cita.",
  ) {
    setIsNewRequestOpen(false);
    setIsNewDependentRequestOpen(false);
    requests.reload(notice);
  }

  return (
    <>
      {/* Encabezado con saludo y resumen de citas activas */}
      <section
        className="rounded-3xl border border-primary/20 bg-primary-soft p-5 shadow-sm sm:p-8"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-primary-dark shadow-sm">
              <HeartHandshake size={24} aria-hidden />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary-dark">
                Espacio de consultante
              </p>
              <h1 className="mt-1 font-display text-3xl font-extrabold text-navy sm:text-4xl">
                {firstName ? `¡Hola, ${firstName}!` : "¡Hola!"}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-muted">
                Un espacio para acompañar tu bienestar y organizar la atención
                de tu familia.
              </p>
              <output
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-sm font-medium text-primary-dark"
              >
                <CalendarDays size={15} aria-hidden />
                {requests.isLoading
                  ? "Cargando tus citas…"
                  : activeSummary(activeCount)}
              </output>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              variant="brand-primary"
              onClick={() => setIsNewRequestOpen(true)}
              disabled={isSelfRequestDisabled}
              aria-describedby={selfRequestDescriptionId}
            >
              <span className="inline-flex items-center gap-2">
                <UserPlus size={16} aria-hidden />
                Solicitar una valoración
              </span>
            </Button>
            <Button
              variant="brand-outline"
              onClick={() => setIsNewDependentRequestOpen(true)}
              disabled={
                !profile.profile ||
                arePackagesLoading ||
                packagesLoadError !== null
              }
              aria-describedby={dependentRequestDescriptionId}
            >
              <span className="inline-flex items-center gap-2">
                <UsersRound size={16} aria-hidden />
                Solicitar valoración para un dependiente
              </span>
            </Button>
          </div>
        </div>

        {arePackagesLoading && (
          <output
            id="self-request-package-loading"
            className="mt-4 block text-sm text-text-muted"
          >
            Verificando el estado de tus paquetes…
          </output>
        )}
        {selfHasActivePackage && (
          <output
            id="self-request-package-notice"
            className="mt-4 block text-sm text-text-muted"
          >
            Tienes un paquete activo. Agenda tus sesiones desde «Mis paquetes»;
            al finalizarlo, podrás solicitar una valoración de continuidad con
            el mismo psicólogo.
          </output>
        )}
        {!selfHasActivePackage && selfHasFinalizedPackage && (
          <output
            id="self-request-follow-up-notice"
            className="mt-4 block text-sm text-text-muted"
          >
            Tu paquete está finalizado. Solicita una valoración de continuidad
            desde «Mis paquetes» para continuar con el mismo psicólogo.
          </output>
        )}
        {packagesLoadError && (
          <div
            id="self-request-package-error"
            className="mt-3 flex flex-wrap items-center gap-3"
          >
            <InlineMessage tone="error">{packagesLoadError}</InlineMessage>
            <Button
              variant="secondary"
              onClick={reloadPackages}
              disabled={arePackagesLoading}
            >
              Reintentar
            </Button>
          </div>
        )}
      </section>

      {/* Lista de solicitudes */}
      <section
        id="mis-citas"
        aria-labelledby="my-appointments-heading"
        className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-7"
      >
        <header className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-dark">
            <CalendarDays size={20} aria-hidden />
          </span>
          <div>
            <h2
              id="my-appointments-heading"
              className="font-display text-2xl font-bold text-primary-dark"
            >
              Mis citas
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-text-muted">
              Tus próximas valoraciones y sesiones aparecen primero.
            </p>
          </div>
        </header>

        {requests.loadError && (
          <div className="mt-6">
            <InlineMessage tone="error">{requests.loadError}</InlineMessage>
          </div>
        )}

        {!requests.isLoading && !requests.loadError && (
          <>
            {requests.requests.length === 0 ? (
              <p className="mt-6 rounded-2xl border border-dashed border-border bg-surface px-5 py-10 text-center text-sm text-text-subtle">
                Todavía no tienes solicitudes. Cuando pidas una cita, la verás
                aquí con su estado.
              </p>
            ) : (
              <>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <label
                    htmlFor="appointments-patient-filter"
                    className="text-sm font-medium text-text-muted"
                  >
                    Mostrar citas de
                  </label>
                  <select
                    id="appointments-patient-filter"
                    value={patientFilter}
                    onChange={(event) => {
                      const { value } = event.currentTarget;
                      if (isPatientFilter(value)) setPatientFilter(value);
                      setAppointmentPage(0);
                    }}
                    className="min-w-52 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text"
                  >
                    <option value={ALL_PATIENTS_FILTER}>
                      Todos los pacientes
                    </option>
                    <option value={SELF_PATIENT_FILTER}>Para mí</option>
                    {dependentNames.map((name) => (
                      <option key={name} value={`dependent:${name}`}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                {filteredRequests.length === 0 ? (
                  <p className="mt-6 rounded-2xl border border-dashed border-border bg-surface px-5 py-10 text-center text-sm text-text-subtle">
                    No hay citas para el paciente seleccionado.
                  </p>
                ) : (
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    {pageRequests.map((request) => (
                      <RequestCard
                        key={request.appId}
                        request={request}
                        onCancel={setRequestToCancel}
                      />
                    ))}
                  </div>
                )}

                {pageCount > 1 && (
                  <nav
                    aria-label="Paginación de mis citas"
                    className="mt-5 flex items-center justify-center gap-4"
                  >
                    <button
                      type="button"
                      aria-label="Mostrar citas anteriores"
                      disabled={currentPage === 0}
                      onClick={() =>
                        setAppointmentPage(Math.max(currentPage - 1, 0))
                      }
                      className="rounded-full border border-border p-2 text-text-muted transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft size={18} aria-hidden />
                    </button>
                    <p aria-live="polite" className="text-sm text-text-muted">
                      {currentPage * APPOINTMENTS_PER_PAGE + 1}–
                      {Math.min(
                        (currentPage + 1) * APPOINTMENTS_PER_PAGE,
                        filteredRequests.length,
                      )}{" "}
                      de {filteredRequests.length}
                    </p>
                    <button
                      type="button"
                      aria-label="Mostrar citas siguientes"
                      disabled={currentPage >= pageCount - 1}
                      onClick={() =>
                        setAppointmentPage(
                          Math.min(currentPage + 1, pageCount - 1),
                        )
                      }
                      className="rounded-full border border-border p-2 text-text-muted transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight size={18} aria-hidden />
                    </button>
                  </nav>
                )}
              </>
            )}

            {requests.notice && (
              <div className="mt-4">
                <InlineMessage tone="success">{requests.notice}</InlineMessage>
              </div>
            )}

            {requests.actionError && (
              <div className="mt-4">
                <InlineMessage tone="error">
                  {requests.actionError}
                </InlineMessage>
              </div>
            )}
          </>
        )}
      </section>

      {/* Diálogos */}
      {requestToCancel && (
        <CancelRequestDialog
          request={requestToCancel}
          isSaving={requests.cancelingId === requestToCancel.appId}
          onConfirm={confirmCancel}
          onClose={() => setRequestToCancel(null)}
        />
      )}

      {isNewRequestOpen && profile.profile && (
        <NewRequestDialog
          profile={profile.profile}
          onCreated={handleCreated}
          onClose={() => setIsNewRequestOpen(false)}
        />
      )}
      {isNewDependentRequestOpen && profile.profile && (
        <NewDependentRequestDialog
          profile={profile.profile}
          carePackages={packages}
          onCreated={() =>
            handleCreated(
              "La cita de valoración del dependiente quedó reservada en el horario seleccionado.",
            )
          }
          onClose={() => setIsNewDependentRequestOpen(false)}
        />
      )}
    </>
  );
}

import type { MyRequest } from "@/features/my-account/types/my-account-types";
import type { CarePackage } from "../types/care-package-types";

/** Appointment states that represent an unresolved appointment. */
const OPEN_APPOINTMENT_STATES = new Set(["pendiente", "asignada", "confirmada"]);

/**
 * Normalizes patient names for matching package and appointment records.
 * @param name Patient name from an API record.
 * @returns A trimmed, case- and accent-insensitive name.
 */
function normalizePatientName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("es");
}

/**
 * Checks whether two packages belong to the same patient.
 * @param left First care package.
 * @param right Second care package.
 * @returns Whether both packages identify the same patient.
 */
function isSamePackagePatient(left: CarePackage, right: CarePackage): boolean {
  if (left.patientType !== right.patientType) return false;
  if (left.patientId != null && right.patientId != null) {
    return left.patientId === right.patientId;
  }
  return normalizePatientName(left.patientName) === normalizePatientName(right.patientName);
}

/**
 * Checks whether a request belongs to the patient associated with a package.
 * @param carePackage Care package whose patient is being checked.
 * @param request Appointment request to compare.
 * @returns Whether the request belongs to the package patient.
 */
function isRequestForPackagePatient(
  carePackage: CarePackage,
  request: MyRequest,
): boolean {
  return (
    carePackage.patientType === request.patientType &&
    normalizePatientName(carePackage.patientName) ===
      normalizePatientName(request.patientName)
  );
}

/**
 * Returns why a finalized package cannot start a follow-up valuation.
 * @param carePackage Finalized package being considered.
 * @param packages All packages belonging to the consultant and dependents.
 * @param requests Appointment requests belonging to the consultant and dependents.
 * @returns A user-facing restriction message, or null when booking is allowed.
 */
export function getFollowUpValuationRestriction(
  carePackage: CarePackage,
  packages: readonly CarePackage[],
  requests: readonly MyRequest[],
): string | null {
  if (carePackage.state !== "finalizado") {
    return "La valoración de continuidad solo está disponible para paquetes finalizados.";
  }

  const patientPackages = packages.filter(
    (candidate) =>
      candidate.id !== carePackage.id &&
      isSamePackagePatient(carePackage, candidate),
  );

  if (patientPackages.some((candidate) => candidate.state === "activo")) {
    return "Este paciente tiene un paquete activo. Agenda sus sesiones desde ese paquete.";
  }
  if (patientPackages.some((candidate) => candidate.state === "sugerido")) {
    return "Hay una sugerencia de paquete pendiente de revisión por secretaría.";
  }
  if (
    patientPackages.some(
      (candidate) =>
        candidate.state === "finalizado" &&
        Date.parse(candidate.createdAt) > Date.parse(carePackage.createdAt),
    )
  ) {
    return "Solicita la valoración desde el paquete finalizado más reciente.";
  }
  if (
    requests.some(
      (request) =>
        isRequestForPackagePatient(carePackage, request) &&
        request.appKind === "valoracion" &&
        (OPEN_APPOINTMENT_STATES.has(request.appState) ||
          (request.appState === "realizada" &&
            Date.parse(request.appCreatedAt) >
              Date.parse(carePackage.closedAt ?? carePackage.createdAt))),
    )
  ) {
    return "Este paciente ya tiene una valoración en curso o pendiente de sugerencia de paquete.";
  }

  return null;
}

/**
 * Finds a dependent's active or finalized package by their entered name.
 * @param patientName Dependent name entered in the request form.
 * @param packages Packages available in the consultant account.
 * @returns The matching package that should prevent a general valuation request, or null.
 */
export function findDependentPackageForValuation(
  patientName: string,
  packages: readonly CarePackage[],
): CarePackage | null {
  const normalizedName = normalizePatientName(patientName);
  if (!normalizedName) return null;

  return (
    packages
      .filter(
        (carePackage) =>
          carePackage.patientType === "dependent" &&
          normalizePatientName(carePackage.patientName) === normalizedName &&
          (carePackage.state === "activo" ||
            carePackage.state === "finalizado"),
      )
      .sort((left, right) => {
        if (left.state !== right.state) {
          return left.state === "activo" ? -1 : 1;
        }
        return right.createdAt.localeCompare(left.createdAt);
      })[0] ?? null
  );
}

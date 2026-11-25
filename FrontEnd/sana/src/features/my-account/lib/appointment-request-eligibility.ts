import type { CarePackage } from "@/features/care-packages/types/care-package-types";

/**
 * Checks whether the requester has an active self-care package.
 * @param packages Packages returned for the signed-in requester.
 * @returns True when an active package belongs to the requester.
 */
export function hasActiveSelfCarePackage(
  packages: readonly Pick<CarePackage, "patientType" | "state">[],
): boolean {
  return packages.some(
    (carePackage) =>
      carePackage.patientType === "self" && carePackage.state === "activo",
  );
}

/**
 * Checks whether the requester has an active or finalized self-care package.
 * @param packages Packages returned for the signed-in requester.
 * @returns True when the general valuation form must be replaced by package scheduling.
 */
export function hasSelfPackageRequiringPackageFlow(
  packages: readonly Pick<CarePackage, "patientType" | "state">[],
): boolean {
  return packages.some(
    (carePackage) =>
      carePackage.patientType === "self" &&
      (carePackage.state === "activo" || carePackage.state === "finalizado"),
  );
}

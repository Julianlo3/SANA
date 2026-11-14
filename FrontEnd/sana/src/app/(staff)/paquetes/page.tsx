import type { Metadata } from "next";
import { requireAnyRole } from "@/lib/auth-guard";
import CarePackageRequestsPage from "@/features/care-packages/pages/care-package-requests-page";

export const metadata: Metadata = {
  title: "Solicitudes de paquetes | SANA",
};

/**
 * Renders the secretary package-request inbox.
 * @returns The package-request page.
 */
export default async function CarePackageRequestsRoute() {
  await requireAnyRole(["secretario"]);
  return <CarePackageRequestsPage />;
}

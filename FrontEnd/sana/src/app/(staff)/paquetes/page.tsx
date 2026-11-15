import type { Metadata } from "next";
import { requireAnyRole } from "@/lib/auth-guard";
import CarePackageRequestsPage from "@/features/care-packages/pages/care-package-requests-page";

export const metadata: Metadata = {
  title: "Paquetes de atención | SANA",
};

/**
 * Renders the secretary package management page.
 * @returns The package management page.
 */
export default async function CarePackageRequestsRoute() {
  await requireAnyRole(["secretario"]);
  return <CarePackageRequestsPage />;
}

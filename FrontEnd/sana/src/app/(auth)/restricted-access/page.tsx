import type { Metadata } from "next";
import RestrictedAccessPage from "@/features/auth/pages/restricted-access-page";

export const metadata: Metadata = { title: "Acceso restringido | SANA" };

export default function RestrictedAccess() {
  return <RestrictedAccessPage />;
}

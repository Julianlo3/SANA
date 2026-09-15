import type { Metadata } from "next";
import PendingAccountPage from "@/features/auth/pages/pending-account-page";

export const metadata: Metadata = { title: "Cuenta pendiente | SANA" };

export default function PendingAccount() {
  return <PendingAccountPage />;
}

import type { Metadata } from "next";
import SessionExpiredPage from "@/features/auth/pages/session-expired-page";

export const metadata: Metadata = { title: "Sesión terminada | SANA" };

export default function SessionExpired() {
  return <SessionExpiredPage />;
}

import type { Metadata } from "next";
import ReportsDashboardPage from "@/features/reports/pages/reports-dashboard-page";

/**
 * Metadata for the administrator reports page.
 */
export const metadata: Metadata = { title: "Reportes | SANA" };

/**
 * Renders the administrator reports route.
 * @returns The reports dashboard.
 */
export default function ReportsPage() {
  return <ReportsDashboardPage />;
}

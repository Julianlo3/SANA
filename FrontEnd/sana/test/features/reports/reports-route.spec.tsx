import { describe, expect, it } from "vitest";
import ReportsDashboardPage from "@/features/reports/pages/reports-dashboard-page";
import ReportsPage, { metadata } from "@/app/(dashboard)/reportes/page";

describe("reports route", () => {
  it("sets the page title and renders the reports dashboard", () => {
    expect(metadata.title).toBe("Reportes | SANA");
    expect(ReportsPage().type).toBe(ReportsDashboardPage);
  });
});

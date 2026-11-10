// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ReportsDashboardPage from "@/features/reports/pages/reports-dashboard-page";
import type { ReportsSummary } from "@/features/reports/types/report-types";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  useReportsSummary: vi.fn(),
}));

vi.mock("@/features/reports/hooks/use-reports-summary", () => ({
  useReportsSummary: mocks.useReportsSummary,
}));

const summary: ReportsSummary = {
  psychology: {
    totalCompletedAppointments: 12,
    averageCompletedAppointmentsPerPsychologist: 3,
    activePsychologists: 4,
  },
  system: {
    totalConsultants: 6,
    averageAppointmentsPerConsultant: 2.5,
  },
  donations: {
    totalAmountInCents: "250000",
    approvedDonations: 5,
    peopleWhoDonated: 4,
  },
};

describe("ReportsDashboardPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders the aggregate report groups without the removed filters notice", () => {
    mocks.useReportsSummary.mockReturnValue({
      summary,
      isLoading: false,
      error: null,
      refresh: mocks.refresh,
    });

    render(<ReportsDashboardPage />);

    expect(screen.getByRole("heading", { name: "Reportes" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Psicología" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Sistema" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Donaciones" })).toBeTruthy();
    expect(screen.getByText("Citas realizadas")).toBeTruthy();
    expect(screen.getByText("Consultantes activos")).toBeTruthy();
    expect(screen.getByText("Personas donantes")).toBeTruthy();
    expect(
      screen.queryByText(/no admite filtros por fecha ni otros criterios/),
    ).toBeNull();
    expect(screen.getByText("Monto aprobado").parentElement?.textContent).toContain(
      "2.500",
    );
  });

  it("refreshes the summary when requested", () => {
    mocks.useReportsSummary.mockReturnValue({
      summary,
      isLoading: false,
      error: null,
      refresh: mocks.refresh,
    });

    render(<ReportsDashboardPage />);
    fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));

    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("shows a retry action when the initial report request fails", () => {
    mocks.useReportsSummary.mockReturnValue({
      summary: null,
      isLoading: false,
      error: "No pudimos conectarnos con el servidor.",
      refresh: mocks.refresh,
    });

    render(<ReportsDashboardPage />);
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(screen.getByText("No pudimos conectarnos con el servidor.")).toBeTruthy();
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("keeps loaded metrics visible after a refresh error", () => {
    mocks.useReportsSummary.mockReturnValue({
      summary,
      isLoading: false,
      error: "No pudimos conectarnos con el servidor.",
      refresh: mocks.refresh,
    });

    render(<ReportsDashboardPage />);

    expect(screen.getByText("Citas realizadas")).toBeTruthy();
    expect(screen.getByText("No pudimos conectarnos con el servidor.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Reintentar" })).toBeNull();
  });

  it("shows loading state and disables refresh before the first response", () => {
    mocks.useReportsSummary.mockReturnValue({
      summary: null,
      isLoading: true,
      error: null,
      refresh: mocks.refresh,
    });

    render(<ReportsDashboardPage />);

    expect(screen.getByRole("status").textContent).toContain("Cargando reportes");
    expect(screen.getByRole("button", { name: "Actualizar" }).hasAttribute("disabled")).toBe(
      true,
    );
  });

  it("rounds centavos when formatting the approved donation amount", () => {
    mocks.useReportsSummary.mockReturnValue({
      summary: {
        ...summary,
        donations: { ...summary.donations, totalAmountInCents: "250050" },
      },
      isLoading: false,
      error: null,
      refresh: mocks.refresh,
    });

    render(<ReportsDashboardPage />);

    expect(
      screen.getByText("Monto aprobado").parentElement?.textContent,
    ).toContain("2.501");
  });
});

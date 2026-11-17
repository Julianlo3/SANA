// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ReportsDashboardPage from "@/features/reports/pages/reports-dashboard-page";
import type {
  AttendanceReport,
  AppointmentsEvolutionReport,
  DonationsEvolutionReport,
  DonationsHistoryReport,
  GeneralManagementReport,
  ReportResponse,
} from "@/features/reports/types/report-types";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  useReportsDashboard: vi.fn(),
}));

vi.mock("@/features/reports/hooks/use-reports-dashboard", () => ({
  useReportsDashboard: mocks.useReportsDashboard,
}));

const generalReport: GeneralManagementReport = {
  period: {
    startDate: "2026-10-17T05:00:00.000Z",
    endDate: "2026-11-16T04:59:59.999Z",
    previousStartDate: "2026-09-17T05:00:00.000Z",
    previousEndDate: "2026-10-17T04:59:59.999Z",
    preset: "last_month",
    periodLabel: "17/10/2026 al 16/11/2026",
    generatedAt: "2026-11-16T21:00:00.000Z",
  },
  appointments: {
    total: 14,
    completed: 10,
    scheduled: 2,
    cancelled: 1,
    noShow: 1,
    comparisonWithPrevious: {
      current: 14,
      previous: 10,
      difference: 4,
      percentage: 40,
    },
  },
  users: {
    totalRegistered: 50,
    newRegistered: 6,
    comparisonWithPrevious: {
      current: 6,
      previous: 4,
      difference: 2,
      percentage: 50,
    },
  },
  donations: {
    confirmedDonationsCount: 5,
    totalAmountInCents: "250050",
    currency: "COP",
    countComparison: {
      current: 5,
      previous: 3,
      difference: 2,
      percentage: 66.7,
    },
    amountComparison: {
      currentAmountInCents: "250050",
      previousAmountInCents: "200000",
      differenceInCents: "50050",
      percentage: 25,
    },
  },
  timeline: [
    {
      date: "2026-11-14",
      appointmentsCount: 4,
      completedAppointmentsCount: 3,
      donationsCount: 2,
      donationsAmountInCents: "100000",
    },
  ],
};

const generalResponse: ReportResponse = { kind: "general", data: generalReport };

const donationsHistoryReport: DonationsHistoryReport = {
  period: {
    ...generalReport.period,
    startDate: "2026-10-17",
    endDate: "2026-11-16",
  },
  summary: {
    totalTransactions: 204,
    confirmedCount: 3,
    confirmedAmountInCents: "9000",
    pendingCount: 1,
    pendingAmountInCents: "1000",
    declinedCount: 0,
    declinedAmountInCents: "0",
    averageConfirmedAmountInCents: "3000",
    currency: "COP",
  },
  byStatus: [
    {
      status: "APPROVED",
      count: 3,
      amountInCents: "9000",
      percentage: 75,
    },
    {
      status: "PENDING",
      count: 1,
      amountInCents: "1000",
      percentage: 25,
    },
  ],
  byPaymentMethod: [
    {
      paymentMethod: "NEQUI",
      count: 3,
      confirmedCount: 2,
      confirmedAmountInCents: "6000",
      percentage: 75,
    },
    {
      paymentMethod: "PSE",
      count: 1,
      confirmedCount: 1,
      confirmedAmountInCents: "3000",
      percentage: 25,
    },
  ],
  transactions: [
    {
      donId: 1,
      wompiTransactionId: "wompi-1",
      reference: "ref-1",
      amountInCents: "5000",
      currency: "COP",
      status: "APPROVED",
      paymentMethodType: "NEQUI",
      donorFullName: "Ana",
      donorEmailMasked: "a***@example.com",
      createdAt: "2026-11-14T12:00:00.000Z",
    },
    {
      donId: 2,
      wompiTransactionId: "wompi-2",
      reference: "ref-2",
      amountInCents: "3000",
      currency: "COP",
      status: "APPROVED",
      paymentMethodType: "PSE",
      donorFullName: "Luis",
      donorEmailMasked: "l***@example.com",
      createdAt: "2026-11-15T12:00:00.000Z",
    },
    {
      donId: 3,
      wompiTransactionId: "wompi-3",
      reference: "ref-3",
      amountInCents: "1000",
      currency: "COP",
      status: "APPROVED",
      paymentMethodType: "NEQUI",
      donorFullName: "Sol",
      donorEmailMasked: "s***@example.com",
      createdAt: "2026-11-16T12:00:00.000Z",
    },
    {
      donId: 4,
      wompiTransactionId: "wompi-4",
      reference: "ref-4",
      amountInCents: "1000",
      currency: "COP",
      status: "PENDING",
      paymentMethodType: "NEQUI",
      donorFullName: null,
      donorEmailMasked: null,
      createdAt: "2026-11-16T12:00:00.000Z",
    },
  ],
};

const donationsEvolutionReport: DonationsEvolutionReport = {
  period: donationsHistoryReport.period,
  summary: {
    confirmedCount: 3,
    totalAmountInCents: "9000",
    averageAmountInCents: "3000",
    highestAmountInCents: "5000",
    lowestAmountInCents: "1000",
    currency: "COP",
  },
  comparisonWithPrevious: {
    currentAmountInCents: "9000",
    previousAmountInCents: "8000",
    differenceInCents: "1000",
    percentageVariation: 12.5,
    countComparison: {
      current: 3,
      previous: 2,
      difference: 1,
      percentage: 50,
    },
  },
  valueRanges: [
    {
      rangeLabel: "Hasta $5.000",
      count: 3,
      totalAmountInCents: "9000",
      percentageOfTotal: 100,
    },
  ],
  timeline: [
    { date: "2026-11-14", count: 1, amountInCents: "5000" },
    { date: "2026-11-15", count: 1, amountInCents: "3000" },
    { date: "2026-11-16", count: 1, amountInCents: "1000" },
  ],
};

const appointmentsReport: AppointmentsEvolutionReport = {
  period: generalReport.period,
  dateBasis: "created",
  totalAppointments: 25,
  dailyAverage: 0.83,
  comparisonWithPrevious: {
    current: 25,
    previous: 20,
    difference: 5,
    percentage: 25,
  },
  peakDays: {
    highest: { day: "2026-11-16", count: 25 },
    lowest: { day: "2026-11-16", count: 25 },
  },
  byState: [{ state: "pendiente", count: 25, percentage: 100 }],
  byModality: [{ modality: "virtual", count: 25, percentage: 100 }],
  byKind: [{ kind: "valoracion", count: 25, percentage: 100 }],
  timeline: [
    {
      date: "2026-11-16",
      total: 25,
      realizada: 0,
      confirmada: 0,
      cancelada: 0,
      no_asistio: 0,
      otros: 25,
    },
  ],
  records: Array.from({ length: 25 }, (_, index) => ({
    appId: 25 - index,
    scheduledDate: null,
    createdAt: "2026-11-16T18:00:00.000Z",
    state: "pendiente",
    modality: "virtual",
    kind: "valoracion",
    psychologistName: "Sin asignar",
  })),
};

const singleMonthAttendanceReport: AttendanceReport = {
  period: generalReport.period,
  metrics: {
    totalPastAppointments: 4,
    completedAppointments: 4,
    noShowAppointments: 0,
    otherPastAppointments: 0,
    evaluatedAppointments: 4,
    attendanceRate: 100,
    noShowRate: 0,
    comparisonWithPreviousAttendanceRate: {
      currentRate: 100,
      previousRate: null,
      difference: null,
    },
  },
  monthlyEvolution: [
    {
      month: "2026-11",
      completed: 4,
      noShow: 0,
      evaluated: 4,
      attendanceRate: 100,
      noShowRate: 0,
    },
  ],
  byPsychologist: [
    {
      psyId: 7,
      psychologistName: "Ana Psicóloga",
      completed: 4,
      noShow: 0,
      evaluated: 4,
      attendanceRate: 100,
      noShowRate: 0,
    },
    {
      psyId: 8,
      psychologistName: "Luis Psicólogo",
      completed: 2,
      noShow: 1,
      evaluated: 3,
      attendanceRate: 66.7,
      noShowRate: 33.3,
    },
  ],
  byModality: [],
  byKind: [],
};

describe("ReportsDashboardPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders the general report metrics, period and comparison", () => {
    mocks.useReportsDashboard.mockReturnValue({
      response: generalResponse,
      isLoading: false,
      error: null,
      refresh: mocks.refresh,
    });

    render(<ReportsDashboardPage />);

    expect(screen.getByRole("heading", { name: "Reportes" })).toBeTruthy();
    expect(screen.getByText("Citas en el periodo")).toBeTruthy();
    expect(screen.getByText("Nuevos registros")).toBeTruthy();
    expect(screen.getByText("Donaciones confirmadas")).toBeTruthy();
    expect(screen.getByText("17/10/2026 al 16/11/2026")).toBeTruthy();
    expect(screen.getByText("+40% vs. periodo anterior")).toBeTruthy();
    expect(screen.getByText(/2.501/)).toBeTruthy();
  });

  it("refreshes the active report when requested", () => {
    mocks.useReportsDashboard.mockReturnValue({
      response: generalResponse,
      isLoading: false,
      error: null,
      refresh: mocks.refresh,
    });

    render(<ReportsDashboardPage />);
    fireEvent.click(screen.getByRole("button", { name: "Actualizar" }));

    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("shows a retry action when the report request fails", () => {
    mocks.useReportsDashboard.mockReturnValue({
      response: null,
      isLoading: false,
      error: "No pudimos conectarnos con el servidor.",
      refresh: mocks.refresh,
    });

    render(<ReportsDashboardPage />);
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(screen.getByText("No pudimos conectarnos con el servidor.")).toBeTruthy();
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("shows loading state and disables refresh before the first response", () => {
    mocks.useReportsDashboard.mockReturnValue({
      response: null,
      isLoading: true,
      error: null,
      refresh: mocks.refresh,
    });

    render(<ReportsDashboardPage />);

    expect(screen.getByRole("status").textContent).toContain("Cargando general");
    expect(
      screen.getByRole("button", { name: "Actualizar" }).hasAttribute("disabled"),
    ).toBe(true);
  });

  it("switches report views while preserving the shared date filter", () => {
    mocks.useReportsDashboard.mockReturnValue({
      response: generalResponse,
      isLoading: false,
      error: null,
      refresh: mocks.refresh,
    });

    render(<ReportsDashboardPage />);
    expect(
      screen.getByText("2 pendientes, asignadas o confirmadas"),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Citas" }));

    expect(mocks.useReportsDashboard).toHaveBeenLastCalledWith(
      "appointments",
      expect.objectContaining({ preset: "last_month" }),
      true,
    );
    expect(screen.getByLabelText("Estado")).toBeTruthy();
  });

  it("keeps the unfiltered appointment chart aligned with General when donation-only dates exist", () => {
    const annualPeriod = {
      ...generalReport.period,
      startDate: "2026-01-01T00:00:00.000Z",
      endDate: "2026-11-16T23:59:59.999Z",
    };
    const generalWithDonationOnlyDate: GeneralManagementReport = {
      ...generalReport,
      period: annualPeriod,
      timeline: [
        {
          date: "2026-03-10",
          appointmentsCount: 0,
          completedAppointmentsCount: 0,
          donationsCount: 1,
          donationsAmountInCents: "5000",
        },
        {
          date: "2026-03-11",
          appointmentsCount: 3,
          completedAppointmentsCount: 0,
          donationsCount: 0,
          donationsAmountInCents: "0",
        },
        {
          date: "2026-11-16",
          appointmentsCount: 7,
          completedAppointmentsCount: 0,
          donationsCount: 0,
          donationsAmountInCents: "0",
        },
      ],
    };
    const annualAppointmentsReport: AppointmentsEvolutionReport = {
      ...appointmentsReport,
      period: annualPeriod,
      totalAppointments: 10,
      byState: [{ state: "pendiente", count: 10, percentage: 100 }],
      timeline: [
        {
          date: "2026-03-11",
          total: 3,
          realizada: 0,
          confirmada: 0,
          cancelada: 0,
          no_asistio: 0,
          otros: 3,
        },
        {
          date: "2026-11-16",
          total: 7,
          realizada: 0,
          confirmada: 0,
          cancelada: 0,
          no_asistio: 0,
          otros: 7,
        },
      ],
    };
    mocks.useReportsDashboard.mockImplementation((kind) => ({
      response:
        kind === "appointments"
          ? { kind, data: annualAppointmentsReport }
          : kind === "general"
            ? { kind, data: generalWithDonationOnlyDate }
            : generalResponse,
      isLoading: false,
      error: null,
      refresh: mocks.refresh,
    }));

    render(<ReportsDashboardPage />);
    const generalChart = screen.getByRole("img", {
      name: "Gráfico de tendencia: Citas, Realizadas",
    });
    const generalPaths = [...generalChart.querySelectorAll("path")].map((path) =>
      path.getAttribute("d"),
    );

    fireEvent.click(screen.getByRole("tab", { name: "Citas" }));
    const appointmentsChart = screen.getByRole("img", {
      name: "Gráfico de tendencia: Total, Realizadas",
    });
    const appointmentsPaths = [
      ...appointmentsChart.querySelectorAll("path"),
    ].map((path) => path.getAttribute("d"));

    expect(appointmentsPaths).toEqual(generalPaths);
  });

  it("shows a single-month attendance summary instead of implying a trend", () => {
    mocks.useReportsDashboard.mockReturnValue({
      response: { kind: "attendance", data: singleMonthAttendanceReport },
      isLoading: false,
      error: null,
      refresh: mocks.refresh,
    });

    render(<ReportsDashboardPage />);
    fireEvent.click(screen.getByRole("tab", { name: "Asistencia" }));

    expect(
      screen.getByText(
        "Solo hay datos de un mes; se muestran los resultados, no una tendencia.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText("4 evaluadas · Sin comparación disponible"),
    ).toBeTruthy();
    expect(screen.getByText("4 citas · 100%")).toBeTruthy();
    expect(screen.getByText("0 citas · 0%")).toBeTruthy();
    expect(
      screen.queryByRole("img", {
        name: "Gráfico de tendencia: Asistencia, Inasistencia",
      }),
    ).toBeNull();
  });

  it("shows ten appointment records per page and navigates with arrows", () => {
    mocks.useReportsDashboard.mockReturnValue({
      response: { kind: "appointments", data: appointmentsReport },
      isLoading: false,
      error: null,
      refresh: mocks.refresh,
    });

    render(<ReportsDashboardPage />);
    fireEvent.click(screen.getByRole("tab", { name: "Citas" }));

    expect(screen.getByText("0,83")).toBeTruthy();
    expect(
      screen.getByText("Promedio por día del periodo").textContent,
    ).toBe("Promedio por día del periodo");
    const activeDaysMetric = screen
      .getByText("Días con citas")
      .closest("article");
    expect(activeDaysMetric?.textContent).toContain("1");
    expect(activeDaysMetric?.textContent).toContain("Fechas con actividad");
    expect(screen.queryByText("Día de menor actividad")).toBeNull();
    expect(
      screen.getByRole("img", {
        name: "Gráfico de tendencia: Total, Realizadas",
      }),
    ).toBeTruthy();
    expect(screen.getByText("#25")).toBeTruthy();
    expect(screen.getByText("#16")).toBeTruthy();
    expect(screen.queryByText("#15")).toBeNull();
    expect(screen.getByText("1–10 de 25")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Página siguiente" }));
    expect(screen.getByText("#15")).toBeTruthy();
    expect(screen.getByText("#6")).toBeTruthy();
    expect(screen.queryByText("#16")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Página anterior" }));
    expect(screen.getByText("#25")).toBeTruthy();
    expect(screen.queryByText("#15")).toBeNull();
  });

  it("offers a psychologist filter and shows its clear action only when selected", () => {
    mocks.useReportsDashboard.mockReturnValue({
      response: { kind: "attendance", data: singleMonthAttendanceReport },
      isLoading: false,
      error: null,
      refresh: mocks.refresh,
    });

    render(<ReportsDashboardPage />);
    fireEvent.click(screen.getByRole("tab", { name: "Asistencia" }));

    expect(screen.getByRole("option", { name: "Ana Psicóloga" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Limpiar" })).toBeNull();

    fireEvent.change(screen.getByLabelText("Psicólogo"), {
      target: { value: "7" },
    });
    expect(screen.getByRole("button", { name: "Limpiar" })).toBeTruthy();
    expect(mocks.useReportsDashboard).toHaveBeenLastCalledWith(
      "attendance",
      expect.objectContaining({ psyId: 7 }),
      true,
    );

    fireEvent.click(screen.getByRole("button", { name: "Limpiar" }));
    expect(screen.queryByRole("button", { name: "Limpiar" })).toBeNull();
  });

  it("groups both donation reports under one section with two inner views", () => {
    mocks.useReportsDashboard.mockImplementation((kind) => ({
      response:
        kind === "donations-evolution"
          ? { kind, data: donationsEvolutionReport }
          : kind === "donations-history"
            ? { kind, data: donationsHistoryReport }
            : generalResponse,
      isLoading: false,
      error: null,
      refresh: mocks.refresh,
    }));

    render(<ReportsDashboardPage />);
    fireEvent.click(screen.getByRole("tab", { name: "Donaciones" }));

    expect(screen.getAllByRole("tab", { name: "Donaciones" })).toHaveLength(1);
    expect(screen.getByRole("tab", { name: "Historial" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Evolución" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Transacciones por estado" })).toBeTruthy();
    expect(screen.queryByText("Monto confirmado")).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: "Evolución" }));
    expect(mocks.useReportsDashboard).toHaveBeenLastCalledWith(
      "donations-evolution",
      expect.objectContaining({ preset: "last_month" }),
      true,
    );
    expect(screen.getByRole("heading", { name: "Monto total donado por mes" })).toBeTruthy();
    const reportHeadings = [...document.querySelectorAll("h3")].map(
      (heading) => heading.textContent,
    );
    expect(reportHeadings.indexOf("Aportes por rango de valor")).toBeLessThan(
      reportHeadings.indexOf("Monto total donado por mes"),
    );
    expect(
      screen.queryByRole("heading", {
        name: "Monto confirmado por donante",
      }),
    ).toBeNull();
    const monthlyChart = screen.getByRole("img", {
      name: /Gráfico de tendencia: Total mensual/,
    });
    expect(monthlyChart.getAttribute("viewBox")).toMatch(/1080 360$/);
    expect(monthlyChart.querySelectorAll("circle")).toHaveLength(2);
    expect(monthlyChart.querySelectorAll("path")).not.toHaveLength(0);
    const monthLabels = [...monthlyChart.querySelectorAll("text")].map((label) =>
      label.textContent?.toLocaleLowerCase("es-CO") ?? "",
    );
    expect(monthLabels.some((label) => label.includes("oct"))).toBe(true);
    expect(monthLabels.some((label) => label.includes("nov"))).toBe(true);
    const monthLabelElements = [...monthlyChart.querySelectorAll("text")].filter(
      (label) => /oct|nov/i.test(label.textContent ?? ""),
    );
    expect(Number(monthLabelElements[0].getAttribute("x"))).toBeGreaterThanOrEqual(88);
    const chartWidth = Number(monthlyChart.getAttribute("viewBox")?.split(" ")[2]);
    const lastMonthX = Number(
      monthLabelElements[monthLabelElements.length - 1].getAttribute("x"),
    );
    expect(chartWidth - lastMonthX).toBeGreaterThanOrEqual(88);
  });

  it("filters payment methods as the user types and applies a selected option", () => {
    mocks.useReportsDashboard.mockReturnValue({
      response: { kind: "donations-history", data: donationsHistoryReport },
      isLoading: false,
      error: null,
      refresh: mocks.refresh,
    });

    render(<ReportsDashboardPage />);
    fireEvent.click(screen.getByRole("tab", { name: "Donaciones" }));
    const paymentMethodInput = screen.getByRole("combobox", {
      name: "Medio de pago",
    });
    fireEvent.focus(paymentMethodInput);
    fireEvent.change(paymentMethodInput, { target: { value: "Ne" } });

    expect(screen.getByRole("option", { name: "Nequi" })).toBeTruthy();
    expect(screen.queryByRole("option", { name: "PSE" })).toBeNull();

    fireEvent.click(screen.getByRole("option", { name: "Nequi" }));
    expect(mocks.useReportsDashboard).toHaveBeenLastCalledWith(
      "donations-history",
      expect.objectContaining({ paymentMethod: "NEQUI" }),
      true,
    );
  });

  it("shows donor amount bars in history and provides a clear action", () => {
    mocks.useReportsDashboard.mockReturnValue({
      response: { kind: "donations-history", data: donationsHistoryReport },
      isLoading: false,
      error: null,
      refresh: mocks.refresh,
    });

    render(<ReportsDashboardPage />);
    fireEvent.click(screen.getByRole("tab", { name: "Donaciones" }));

    expect(
      screen.getByRole("heading", { name: "Monto confirmado por donante" }),
    ).toBeTruthy();
    expect(screen.getByRole("img", { name: /Ana · a\*\*\*@example\.com/ })).toBeTruthy();
    expect(screen.getByRole("img", { name: /Luis/ })).toBeTruthy();
    expect(screen.getByRole("img", { name: /Sol/ })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Vista general" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Limpiar" })).toBeNull();

    fireEvent.change(screen.getByLabelText(/Donante/), {
      target: { value: "identity:ana|a***@example.com" },
    });
    expect(screen.getByRole("button", { name: "Limpiar" })).toBeTruthy();
    expect(screen.queryByRole("img", { name: /Luis/ })).toBeNull();
    expect(screen.getByRole("img", { name: /Ana · a\*\*\*@example\.com/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Limpiar" }));
    expect(screen.queryByRole("button", { name: "Limpiar" })).toBeNull();
    expect(screen.getByRole("img", { name: /Luis/ })).toBeTruthy();
  });

  it("treats anonymous donations as one donor in the history chart", () => {
    const donorHistory: DonationsHistoryReport = {
      ...donationsHistoryReport,
      summary: {
        ...donationsHistoryReport.summary,
        totalTransactions: 6,
        confirmedCount: 5,
      },
      transactions: [
        ...donationsHistoryReport.transactions,
        {
          donId: 5,
          wompiTransactionId: "wompi-5",
          reference: "ref-5",
          amountInCents: "100",
          currency: "COP",
          status: "APPROVED",
          paymentMethodType: "NEQUI",
          donorFullName: null,
          donorEmailMasked: null,
          createdAt: "2026-11-16T12:00:00.000Z",
        },
        {
          donId: 6,
          wompiTransactionId: "wompi-6",
          reference: "ref-6",
          amountInCents: "200",
          currency: "COP",
          status: "APPROVED",
          paymentMethodType: "PSE",
          donorFullName: null,
          donorEmailMasked: null,
          createdAt: "2026-11-16T12:00:00.000Z",
        },
      ],
    };
    mocks.useReportsDashboard.mockReturnValue({
      response: { kind: "donations-history", data: donorHistory },
      isLoading: false,
      error: null,
      refresh: mocks.refresh,
    });

    render(<ReportsDashboardPage />);
    fireEvent.click(screen.getByRole("tab", { name: "Donaciones" }));

    const donorFilter = screen.getByLabelText(/Donante/);
    expect(
      [...donorFilter.querySelectorAll("option")].filter(
        (option) => option.textContent === "Anónimo",
      ),
    ).toHaveLength(1);
    expect(screen.getByRole("img", { name: /Ana/ })).toBeTruthy();
    expect(screen.getByText("Otros donantes (1)")).toBeTruthy();

    fireEvent.change(donorFilter, { target: { value: "anonymous" } });
    expect(screen.getByRole("img", { name: /^Anónimo:/ })).toBeTruthy();
  });
});

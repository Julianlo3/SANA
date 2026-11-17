import { beforeEach, describe, expect, it, vi } from "vitest";
import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import { getReport } from "@/features/reports/services/reports-service";

vi.mock("@/services/api/http-client", () => ({
  httpClient: { get: vi.fn() },
}));

describe("reports service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requests the general report with the selected period", async () => {
    const report = { period: { periodLabel: "Periodo de prueba" } };
    const signal = new AbortController().signal;
    vi.mocked(httpClient.get).mockResolvedValueOnce(report);

    await expect(
      getReport("general", { preset: "last_7_days" }, signal),
    ).resolves.toEqual({ kind: "general", data: report });
    expect(httpClient.get).toHaveBeenCalledWith(
      `${ENDPOINTS.reportsGeneral}?preset=last_7_days`,
      signal,
    );
  });

  it("serializes custom dates and appointment filters", async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({});

    await getReport("appointments", {
      preset: "custom",
      startDate: "2026-01-02",
      endDate: "2026-01-15",
      dateBasis: "created",
      state: "realizada",
      modality: "virtual",
      kind: "paquete",
    });

    const [url] = vi.mocked(httpClient.get).mock.calls[0];
    expect(url).toBe(
      `${ENDPOINTS.reportsAppointmentsEvolution}?preset=custom&startDate=2026-01-02&endDate=2026-01-15&dateBasis=created&state=realizada&modality=virtual&kind=paquete`,
    );
  });

  it("does not send report-specific filters to unrelated endpoints", async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({});

    await getReport("general", {
      preset: "today",
      state: "realizada",
      paymentMethod: "card",
    });

    expect(httpClient.get).toHaveBeenCalledWith(
      `${ENDPOINTS.reportsGeneral}?preset=today`,
      undefined,
    );
  });

  it("applies donation status only to history reports", async () => {
    vi.mocked(httpClient.get).mockResolvedValue({});
    const query = {
      preset: "last_month" as const,
      status: "PENDING",
      paymentMethod: "NEQUI",
    };

    await getReport("donations-history", query);
    expect(httpClient.get).toHaveBeenLastCalledWith(
      `${ENDPOINTS.reportsDonationsHistory}?preset=last_month&status=PENDING&paymentMethod=NEQUI`,
      undefined,
    );

    await getReport("donations-evolution", query);
    expect(httpClient.get).toHaveBeenLastCalledWith(
      `${ENDPOINTS.reportsDonationsEvolution}?preset=last_month&paymentMethod=NEQUI`,
      undefined,
    );
  });
});

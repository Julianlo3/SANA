import { beforeEach, describe, expect, it, vi } from "vitest";
import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import { getReportsSummary } from "@/features/reports/services/reports-service";
import type { ReportsSummary } from "@/features/reports/types/report-types";

vi.mock("@/services/api/http-client", () => ({
  httpClient: { get: vi.fn() },
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

describe("getReportsSummary", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requests and returns the aggregate summary", async () => {
    vi.mocked(httpClient.get).mockResolvedValue(summary);
    const controller = new AbortController();

    await expect(getReportsSummary(controller.signal)).resolves.toBe(summary);
    expect(httpClient.get).toHaveBeenCalledWith(
      ENDPOINTS.reportsSummary,
      controller.signal,
    );
  });
});

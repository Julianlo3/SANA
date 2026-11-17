// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getReport } from "@/features/reports/services/reports-service";
import { useReportsDashboard } from "@/features/reports/hooks/use-reports-dashboard";
import type { ReportQuery, ReportResponse } from "@/features/reports/types/report-types";

vi.mock("@/features/reports/services/reports-service", () => ({
  getReport: vi.fn(),
}));

const query: ReportQuery = { preset: "last_month" };
const response: ReportResponse = {
  kind: "general",
  data: {
    period: {
      startDate: "2026-10-17",
      endDate: "2026-11-16",
      previousStartDate: "2026-09-17",
      previousEndDate: "2026-10-16",
      periodLabel: "Periodo de prueba",
      generatedAt: "2026-11-16",
    },
    appointments: {
      total: 0,
      completed: 0,
      scheduled: 0,
      cancelled: 0,
      noShow: 0,
      comparisonWithPrevious: {
        current: 0,
        previous: 0,
        difference: 0,
        percentage: null,
      },
    },
    users: {
      totalRegistered: 0,
      newRegistered: 0,
      comparisonWithPrevious: {
        current: 0,
        previous: 0,
        difference: 0,
        percentage: null,
      },
    },
    donations: {
      confirmedDonationsCount: 0,
      totalAmountInCents: "0",
      currency: "COP",
      countComparison: {
        current: 0,
        previous: 0,
        difference: 0,
        percentage: null,
      },
      amountComparison: {
        currentAmountInCents: "0",
        previousAmountInCents: "0",
        differenceInCents: "0",
        percentage: null,
      },
    },
    timeline: [],
  },
};

describe("useReportsDashboard", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(() => cleanup());

  it("loads the requested report and exposes its result", async () => {
    vi.mocked(getReport).mockResolvedValue(response);
    const { result } = renderHook(() =>
      useReportsDashboard("general", query, true),
    );

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.response).toBe(response));
    expect(result.current.error).toBeNull();
    expect(getReport).toHaveBeenCalledWith("general", query, expect.anything());
  });

  it("exposes request errors and supports retrying", async () => {
    vi.mocked(getReport)
      .mockRejectedValueOnce(new Error("Service unavailable"))
      .mockResolvedValueOnce(response);
    const { result } = renderHook(() =>
      useReportsDashboard("general", query, true),
    );

    await waitFor(() =>
      expect(result.current.error).toBe("Service unavailable"),
    );
    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.response).toBe(response));
    expect(getReport).toHaveBeenCalledTimes(2);
  });

  it("does not request an invalid custom range", () => {
    renderHook(() =>
      useReportsDashboard("general", { preset: "custom" }, false),
    );

    expect(getReport).not.toHaveBeenCalled();
  });

  it("aborts an in-flight request when unmounted", () => {
    vi.mocked(getReport).mockReturnValue(new Promise(() => {}));
    const { unmount } = renderHook(() =>
      useReportsDashboard("general", query, true),
    );
    const signal = vi.mocked(getReport).mock.calls[0][2];

    unmount();

    expect(signal?.aborted).toBe(true);
  });
});

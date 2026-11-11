// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getReportsSummary } from "@/features/reports/services/reports-service";
import { useReportsSummary } from "@/features/reports/hooks/use-reports-summary";
import type { ReportsSummary } from "@/features/reports/types/report-types";

vi.mock("@/features/reports/services/reports-service", () => ({
  getReportsSummary: vi.fn(),
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

describe("useReportsSummary", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(() => cleanup());

  it("loads the summary and clears the loading state", async () => {
    vi.mocked(getReportsSummary).mockResolvedValue(summary);
    const { result } = renderHook(() => useReportsSummary());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.summary).toBe(summary));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(getReportsSummary).toHaveBeenCalledOnce();
  });

  it("exposes the request error and ends loading", async () => {
    vi.mocked(getReportsSummary).mockRejectedValue("failure");
    const { result } = renderHook(() => useReportsSummary());

    await waitFor(() =>
      expect(result.current.error).toBe(
        "No se pudieron cargar los reportes. Intenta de nuevo.",
      ),
    );
    expect(result.current.isLoading).toBe(false);
  });

  it("refreshes while preserving existing data if the refresh fails", async () => {
    vi.mocked(getReportsSummary)
      .mockResolvedValueOnce(summary)
      .mockRejectedValueOnce(new Error("Refresh failed"));
    const { result } = renderHook(() => useReportsSummary());
    await waitFor(() => expect(result.current.summary).toBe(summary));

    act(() => result.current.refresh());
    expect(result.current.isLoading).toBe(true);
    await waitFor(() =>
      expect(result.current.error).toBe("Refresh failed"),
    );
    expect(result.current.summary).toBe(summary);
    expect(result.current.isLoading).toBe(false);
    expect(getReportsSummary).toHaveBeenCalledTimes(2);
  });

  it("aborts an in-flight request when unmounted", () => {
    vi.mocked(getReportsSummary).mockReturnValue(new Promise(() => {}));
    const { unmount } = renderHook(() => useReportsSummary());
    const signal = vi.mocked(getReportsSummary).mock.calls[0][0];

    unmount();

    expect(signal?.aborted).toBe(true);
  });

  it("ignores a successful response after the request is aborted", async () => {
    let resolveRequest!: (value: ReportsSummary) => void;
    vi.mocked(getReportsSummary).mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const { unmount } = renderHook(() => useReportsSummary());

    unmount();
    await act(async () => {
      resolveRequest(summary);
      await Promise.resolve();
    });

    expect(vi.mocked(getReportsSummary).mock.calls[0][0]?.aborted).toBe(true);
  });

  it("ignores a failed response after the request is aborted", async () => {
    let rejectRequest!: (cause: Error) => void;
    vi.mocked(getReportsSummary).mockReturnValue(
      new Promise((_, reject) => {
        rejectRequest = reject;
      }),
    );
    const { unmount } = renderHook(() => useReportsSummary());

    unmount();
    await act(async () => {
      rejectRequest(new Error("Aborted request"));
      await Promise.resolve();
    });

    expect(vi.mocked(getReportsSummary).mock.calls[0][0]?.aborted).toBe(true);
  });
});

// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPolicyDocument } from "@/features/consultation-requests/services/policy-service";
import {
  acceptScheduleTerms,
  getScheduleTermsStatus,
} from "@/features/schedule/services/schedule-service";
import { acceptPsychologistTerms } from "@/features/schedule/services/psychologist-terms-service";
import { useScheduleTerms } from "@/features/schedule/hooks/use-schedule-terms";

vi.mock("@/features/consultation-requests/services/policy-service", () => ({
  getPolicyDocument: vi.fn(),
}));

vi.mock("@/features/schedule/services/schedule-service", () => ({
  acceptScheduleTerms: vi.fn(),
  getScheduleTermsStatus: vi.fn(),
}));

vi.mock("@/features/schedule/services/psychologist-terms-service", () => ({
  acceptPsychologistTerms: vi.fn(),
}));

describe("useScheduleTerms", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getPolicyDocument).mockResolvedValue({
      id: 1,
      type: "schedule_terms",
      version: "1.0",
      content: "Schedule terms",
      effectiveFrom: "2026-01-01",
    });
    vi.mocked(acceptPsychologistTerms).mockResolvedValue();
    vi.mocked(acceptScheduleTerms).mockResolvedValue();
  });

  afterEach(() => cleanup());

  it("opens the calendar immediately after accepting psychologist terms", async () => {
    const { result } = renderHook(() => useScheduleTerms(false));

    await act(async () => {
      await result.current.accept();
    });

    expect(acceptPsychologistTerms).toHaveBeenCalledOnce();
    expect(acceptScheduleTerms).not.toHaveBeenCalled();
    expect(getScheduleTermsStatus).not.toHaveBeenCalled();
    expect(result.current.hasAccepted).toBe(true);
    expect(result.current.acceptError).toBeNull();
  });

  it("keeps the acceptance page usable when saving terms fails", async () => {
    vi.mocked(acceptPsychologistTerms).mockRejectedValueOnce(
      new Error("Request failed"),
    );
    const { result } = renderHook(() => useScheduleTerms(false));

    await act(async () => {
      await result.current.accept();
    });

    expect(result.current.hasAccepted).toBe(false);
    expect(result.current.acceptError).toBe(
      "No pudimos guardar tu aceptación. Intenta de nuevo.",
    );
    expect(result.current.isAccepting).toBe(false);
  });

  it("uses the schedule acceptance endpoint when status reports a missing acceptance", async () => {
    vi.mocked(getScheduleTermsStatus).mockResolvedValueOnce({
      hasAccepted: false,
    });
    const { result } = renderHook(() => useScheduleTerms(true));

    await waitFor(() => expect(result.current.hasAccepted).toBe(false));
    await act(async () => {
      await result.current.accept();
    });

    expect(acceptScheduleTerms).toHaveBeenCalledOnce();
    expect(result.current.hasAccepted).toBe(true);
  });
});

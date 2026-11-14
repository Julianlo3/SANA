import { beforeEach, describe, expect, it, vi } from "vitest";
import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import { completeAppointment } from "@/features/consultants/services/care-record-service";

vi.mock("@/services/api/http-client", () => ({
  httpClient: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

describe("completeAppointment", () => {
  beforeEach(() => vi.clearAllMocks());

  it("submits the priority and optional session suggestion for an assessment", async () => {
    const suggestion = { priority: "alta" as const, sessionLimit: 6 };
    vi.mocked(httpClient.patch).mockResolvedValueOnce(undefined);

    await completeAppointment(44, suggestion);

    expect(httpClient.patch).toHaveBeenCalledWith(
      ENDPOINTS.appointmentComplete(44),
      suggestion,
    );
  });

  it("preserves the empty-body completion for package sessions", async () => {
    vi.mocked(httpClient.patch).mockResolvedValueOnce(undefined);

    await completeAppointment(45);

    expect(httpClient.patch).toHaveBeenCalledWith(
      ENDPOINTS.appointmentComplete(45),
      {},
    );
  });
});

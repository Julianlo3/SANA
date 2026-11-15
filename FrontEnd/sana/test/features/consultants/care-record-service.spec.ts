import { beforeEach, describe, expect, it, vi } from "vitest";
import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import {
  completeAppointment,
  suggestPackageAfterAssessment,
} from "@/features/consultants/services/care-record-service";

vi.mock("@/services/api/http-client", () => ({
  httpClient: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

describe("completeAppointment", () => {
  beforeEach(() => vi.clearAllMocks());

  it("submits the assessment recommendation to the package suggestion endpoint", async () => {
    const suggestion = {
      assessmentAppointmentId: 44,
      priority: "alta" as const,
      sessionLimit: 6,
    };
    vi.mocked(httpClient.post).mockResolvedValueOnce({});

    await suggestPackageAfterAssessment(suggestion);

    expect(httpClient.post).toHaveBeenCalledWith(
      ENDPOINTS.carePackageSuggest,
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

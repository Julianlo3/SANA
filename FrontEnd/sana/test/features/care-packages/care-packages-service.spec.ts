import { beforeEach, describe, expect, it, vi } from "vitest";
import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import {
  bookCarePackageAppointment,
  createCarePackage,
  listCarePackageRequests,
  rejectCarePackageRequest,
} from "@/features/care-packages/services/care-packages-service";
import type {
  CarePackageAppointmentPayload,
  CreateCarePackagePayload,
} from "@/features/care-packages/types/care-package-types";

vi.mock("@/services/api/http-client", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe("care package service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads psychologist suggestions and forwards the assessment identifier when approving", async () => {
    const requests = [
      {
        assessmentAppointmentId: 31,
        patientName: "Consultante",
        patientType: "self",
        requesterName: "Consultante",
        requesterContactNumber: "3000000000",
        requesterEmail: "person@example.com",
        priority: "alta",
        suggestedSessionLimit: null,
      },
    ];
    vi.mocked(httpClient.get).mockResolvedValueOnce(requests);
    const signal = new AbortController().signal;

    await expect(listCarePackageRequests(signal)).resolves.toBe(requests);
    expect(httpClient.get).toHaveBeenCalledWith(
      ENDPOINTS.carePackageRequests,
      signal,
    );

    const payload: CreateCarePackagePayload = {
      assessmentAppointmentId: 31,
      sessionLimit: 8,
      priority: "alta",
    };
    vi.mocked(httpClient.post).mockResolvedValueOnce(undefined);
    await createCarePackage(payload);
    expect(httpClient.post).toHaveBeenCalledWith(
      ENDPOINTS.carePackages,
      payload,
    );
  });

  it("books an appointment with both package linkage fields", async () => {
    const payload: CarePackageAppointmentPayload = {
      appDate: "2026-11-12T10:00:00-05:00",
    };
    vi.mocked(httpClient.post).mockResolvedValueOnce(undefined);

    await bookCarePackageAppointment(12, payload);

    expect(httpClient.post).toHaveBeenCalledWith(
      ENDPOINTS.carePackageAppointments(12),
      payload,
    );
  });

  it("rejects a suggestion by its assessment appointment id", async () => {
    vi.mocked(httpClient.post).mockResolvedValueOnce(undefined);

    await rejectCarePackageRequest(31);

    expect(httpClient.post).toHaveBeenCalledWith(
      ENDPOINTS.carePackageRequestReject(31),
      {},
    );
  });
});

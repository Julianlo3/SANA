import { beforeEach, describe, expect, it, vi } from "vitest";
import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import {
  approveCarePackage,
  bookCarePackageAppointment,
  createCarePackage,
  listCarePackages,
  listCarePackageSuggestions,
  listMyCarePackages,
  rejectCarePackage,
  suggestCarePackage,
} from "@/features/care-packages/services/care-packages-service";
import type {
  ApproveCarePackagePayload,
  CarePackageAppointmentPayload,
  CreateCarePackagePayload,
  RejectCarePackagePayload,
  SuggestCarePackagePayload,
} from "@/features/care-packages/types/care-package-types";

vi.mock("@/services/api/http-client", () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("care package service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads managed packages from the secretary list endpoint", async () => {
    const packages = [
      {
        id: 31,
        state: "activo",
        priority: "alta",
        sessionLimit: 8,
        createdAt: "2026-11-12T10:00:00.000Z",
        closedAt: null,
        psychologistId: 3,
        psychologistName: "Psicóloga",
        patientType: "self",
        patientName: "Consultante",
        completedSessions: 2,
        reservedSessions: 1,
      },
    ];
    vi.mocked(httpClient.get).mockResolvedValueOnce(packages);
    const signal = new AbortController().signal;

    await expect(listCarePackages(signal)).resolves.toBe(packages);
    expect(httpClient.get).toHaveBeenCalledWith(
      ENDPOINTS.carePackages,
      signal,
    );
  });

  it("forwards the package payload to the create endpoint", async () => {
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

  it("submits a psychologist suggestion to the assessment endpoint", async () => {
    const payload: SuggestCarePackagePayload = {
      assessmentAppointmentId: 31,
      sessionLimit: 8,
      priority: "alta",
    };
    const result = { id: 32, state: "sugerido" };
    vi.mocked(httpClient.post).mockResolvedValueOnce(result);

    await expect(suggestCarePackage(payload)).resolves.toBe(result);
    expect(httpClient.post).toHaveBeenCalledWith(
      ENDPOINTS.carePackageSuggest,
      payload,
    );
  });

  it("loads the secretary's pending suggestions from the dedicated endpoint", async () => {
    const suggestions = [{ id: 32, state: "sugerido" }];
    const signal = new AbortController().signal;
    vi.mocked(httpClient.get).mockResolvedValueOnce(suggestions);

    await expect(listCarePackageSuggestions(signal)).resolves.toBe(suggestions);
    expect(httpClient.get).toHaveBeenCalledWith(
      ENDPOINTS.carePackageSuggestions,
      signal,
    );
  });

  it("approves or rejects suggestions with the selected decision data", async () => {
    const approval: ApproveCarePackagePayload = {
      sessionLimit: 6,
      priority: "media",
    };
    const rejection: RejectCarePackagePayload = {
      reason: "Requiere una revisión adicional.",
    };
    vi.mocked(httpClient.patch).mockResolvedValue({});

    await approveCarePackage(32, approval);
    await rejectCarePackage(32, rejection);

    expect(httpClient.patch).toHaveBeenNthCalledWith(
      1,
      ENDPOINTS.carePackageApprove(32),
      approval,
    );
    expect(httpClient.patch).toHaveBeenNthCalledWith(
      2,
      ENDPOINTS.carePackageReject(32),
      rejection,
    );
  });

  it("loads consultant packages from the current account endpoint", async () => {
    const packages = [{ id: 32, state: "activo" }];
    const signal = new AbortController().signal;
    vi.mocked(httpClient.get).mockResolvedValueOnce(packages);

    await expect(listMyCarePackages(signal)).resolves.toBe(packages);
    expect(httpClient.get).toHaveBeenCalledWith(
      ENDPOINTS.carePackagesMine,
      signal,
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

});

// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OwnProfile } from "@/features/my-account/types/my-account-types";
import { useNewDependentRequest } from "@/features/my-account/hooks/use-new-dependent-request";
import type { ConsultantAvailabilitySlot } from "@/features/consultation-requests/types/consultation-request-types";
import type { CarePackage } from "@/features/care-packages/types/care-package-types";

const mocks = vi.hoisted(() => ({
  fetchConsultantAvailability: vi.fn(),
  submitConsultationRequest: vi.fn(),
}));

vi.mock("@/features/consultation-requests/services/consultation-requests-service", () => ({
  fetchConsultantAvailability: mocks.fetchConsultantAvailability,
  submitConsultationRequest: mocks.submitConsultationRequest,
}));

const profile: OwnProfile = {
  fullName: "Ana Ejemplo",
  cardType: "CC",
  identityDocument: "12345678",
  email: "ana@example.com",
  phone: "3001234567",
  birthdate: "1990-01-01",
  gender: "F",
  residenceZone: "Neiva, Huila",
  vulnerabilities: null,
  canEditConsultantFields: true,
};

const slot: ConsultantAvailabilitySlot = {
  date: "2099-01-05",
  startTime: "14:00:00",
  endTime: "15:00:00",
};

const finalizedDependentPackage: CarePackage = {
  id: 8,
  state: "finalizado",
  priority: "media",
  sessionLimit: 6,
  createdAt: "2026-01-01T10:00:00.000Z",
  closedAt: "2026-10-01T10:00:00.000Z",
  psychologistId: 7,
  psychologistName: "Psicóloga",
  patientType: "dependent",
  patientName: "Luis Ejemplo",
  completedSessions: 6,
  reservedSessions: 0,
};

function fillValidRequest(
  result: { current: ReturnType<typeof useNewDependentRequest> },
) {
  act(() => {
    result.current.setField("name", "Luis Ejemplo");
    result.current.setField("identityDocument", "123456789");
    result.current.setField("confirmIdentityDocument", "123456789");
    result.current.setField("birthdate", "2015-04-04");
    result.current.setField("gender", "M");
    result.current.setField("relationship", 1);
    result.current.setAppType("virtual");
    result.current.setReason("Solicitud de valoración");
    result.current.setAccepted(true);
  });
}

describe("dependent appointment request scheduling", () => {
  beforeEach(() => {
    mocks.fetchConsultantAvailability.mockResolvedValue([slot]);
    mocks.submitConsultationRequest.mockResolvedValue({
      appId: 1,
      message: "Created",
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("requires a selected available slot before submitting", async () => {
    const { result } = renderHook(() =>
      useNewDependentRequest(profile, vi.fn()),
    );
    await waitFor(() =>
      expect(result.current.isAvailabilityLoading).toBe(false),
    );
    fillValidRequest(result);

    await act(async () => {
      await result.current.submit();
    });

    expect(mocks.submitConsultationRequest).not.toHaveBeenCalled();
    expect(result.current.errors.appDate).toBe(
      "Selecciona un horario disponible para la valoración.",
    );
  });

  it("submits the dependent valuation with the selected slot date", async () => {
    const onCreated = vi.fn();
    const { result } = renderHook(() =>
      useNewDependentRequest(profile, onCreated),
    );
    await waitFor(() =>
      expect(result.current.isAvailabilityLoading).toBe(false),
    );
    fillValidRequest(result);
    act(() => result.current.setSelectedSlot(slot));

    await act(async () => {
      await result.current.submit();
    });

    expect(mocks.submitConsultationRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        patientType: "dependent",
        appDate: "2099-01-05T14:00:00-05:00",
      }),
    );
    expect(mocks.submitConsultationRequest.mock.calls[0][0]).not.toHaveProperty(
      "appDateIdeal",
    );
    expect(onCreated).toHaveBeenCalledOnce();
  });

  it("blocks the general dependent valuation when that dependent has a finalized package", async () => {
    const { result } = renderHook(() =>
      useNewDependentRequest(profile, vi.fn(), [finalizedDependentPackage]),
    );
    await waitFor(() =>
      expect(result.current.isAvailabilityLoading).toBe(false),
    );
    fillValidRequest(result);
    act(() => result.current.setSelectedSlot(slot));

    await act(async () => {
      await result.current.submit();
    });

    expect(mocks.submitConsultationRequest).not.toHaveBeenCalled();
    expect(result.current.packageRestrictionMessage).toContain(
      "con el psicólogo tratante",
    );
  });
});

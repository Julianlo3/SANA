// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SlotSelection } from "@/features/appointments/components/slot-picker";
import { useAppointmentDetail } from "@/features/appointments/hooks/use-appointment-detail";
import type { Appointment } from "@/features/appointments/types/appointment-types";

const mocks = vi.hoisted(() => ({
  assignAppointment: vi.fn(),
  buildSlotDateTime: vi.fn(() => "2026-11-25T09:00:00-05:00"),
  confirmAppointment: vi.fn(),
  discardAppointment: vi.fn(),
  getAppointment: vi.fn(),
  getPatientPsychologistHistory: vi.fn(),
  listPsychologistOptions: vi.fn(),
  updateAppointmentStatus: vi.fn(),
}));

vi.mock("@/features/appointments/services/appointments-service", () => ({
  assignAppointment: mocks.assignAppointment,
  buildSlotDateTime: mocks.buildSlotDateTime,
  confirmAppointment: mocks.confirmAppointment,
  discardAppointment: mocks.discardAppointment,
  getAppointment: mocks.getAppointment,
  getPatientPsychologistHistory: mocks.getPatientPsychologistHistory,
  listPsychologistOptions: mocks.listPsychologistOptions,
  updateAppointmentStatus: mocks.updateAppointmentStatus,
}));

function createAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    appId: 12,
    appState: "remitida",
    appKind: "valoracion",
    carePackageId: null,
    appType: "virtual",
    appDate: null,
    appDateIdeal: null,
    appDuration: null,
    appDiscardReason: null,
    appCreatedAt: "2026-11-24T10:00:00.000Z",
    requesterId: 15,
    requesterName: "Ana Ejemplo",
    requesterCardType: null,
    requesterIdentityDocument: null,
    requesterContactNumber: null,
    requesterEmail: null,
    patientType: "self",
    patientName: "Ana Ejemplo",
    patientIdentityDocument: null,
    patientBirthdate: null,
    patientGender: null,
    psychologistId: 7,
    psychologistName: "Dra. Laura",
    secretaryName: null,
    relationshipDescription: null,
    referredFromAppId: 9,
    ...overrides,
  };
}

function createSelection(psychologistId: number): SlotSelection {
  return {
    slot: {
      date: "2026-11-25",
      startTime: "09:00:00",
      endTime: "10:00:00",
      psychologists: [
        { id: psychologistId, name: "Psicólogo", speciality: "Clínica" },
      ],
    },
    psychologistId,
    duration: 60,
  };
}

describe("useAppointmentDetail referral assignment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAppointment.mockResolvedValue(createAppointment());
    mocks.getPatientPsychologistHistory.mockResolvedValue([]);
    mocks.listPsychologistOptions.mockResolvedValue([]);
    mocks.assignAppointment.mockImplementation(
      async (_id: number, payload: { psyId: number }) =>
        createAppointment({
          appState: "asignada",
          psychologistId: payload.psyId,
          appDate: "2026-11-25T14:00:00.000Z",
          appDuration: 60,
          referredFromAppId: undefined,
        }),
    );
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps the referred psychologist locked after the first assignment", async () => {
    const { result } = renderHook(() => useAppointmentDetail(12));
    await waitFor(() =>
      expect(result.current.appointment?.appState).toBe("remitida"),
    );

    act(() => result.current.setSelection(createSelection(7)));
    await act(async () => {
      await result.current.assign();
    });

    expect(result.current.appointment?.appState).toBe("asignada");
    expect(result.current.appointment?.referredFromAppId).toBe(9);

    act(() => {
      result.current.startChangingSlot();
      result.current.setSelection(createSelection(8));
    });
    await act(async () => {
      await result.current.assign();
    });

    expect(mocks.assignAppointment).toHaveBeenCalledTimes(1);
    expect(result.current.actionError).toContain(
      "Debes seleccionarlo en el calendario",
    );
  });
});

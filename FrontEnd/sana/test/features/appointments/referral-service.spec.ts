import { beforeEach, describe, expect, it, vi } from "vitest";
import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import {
  assignAppointment,
  listPendingReferrals,
  listReferralPsychologists,
  referAppointment,
} from "@/features/appointments/services/appointments-service";
import type {
  Appointment,
  AssignAppointmentPayload,
  ReferAppointmentPayload,
  ReferAppointmentResult,
  ReferralPsychologistOption,
} from "@/features/appointments/types/appointment-types";

vi.mock("@/services/api/http-client", () => ({
  httpClient: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

describe("referral services", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists eligible referral psychologists for a valuation appointment", async () => {
    const mockPsychologists: ReferralPsychologistOption[] = [
      {
        psyId: 10,
        name: "Dr. Carlos Rojas",
        speciality: "Psicología Clínica Infantil",
        licenseNumber: 12345,
      },
    ];
    const signal = new AbortController().signal;
    vi.mocked(httpClient.get).mockResolvedValueOnce(mockPsychologists);

    const result = await listReferralPsychologists(5, signal);

    expect(result).toBe(mockPsychologists);
    expect(httpClient.get).toHaveBeenCalledWith(
      ENDPOINTS.appointmentReferralPsychologists(5),
      signal,
    );
  });

  it("submits a referral request for an evaluation appointment", async () => {
    const payload: ReferAppointmentPayload = {
      targetPsychologistId: 10,
      reason: "Requiere especialista en neuropsicología.",
    };
    const mockResult = {
      sourceAppointment: { appId: 5, appState: "realizada" },
      referredAppointment: { appId: 12, appState: "remitida" },
    } as unknown as ReferAppointmentResult;

    vi.mocked(httpClient.post).mockResolvedValueOnce(mockResult);

    const result = await referAppointment(5, payload);

    expect(result).toBe(mockResult);
    expect(httpClient.post).toHaveBeenCalledWith(
      ENDPOINTS.appointmentRefer(5),
      payload,
    );
  });

  it("lists pending referrals filtered by default state 'remitida'", async () => {
    const mockReferrals = [{ appId: 12, appState: "remitida" }] as unknown as Appointment[];
    const signal = new AbortController().signal;
    vi.mocked(httpClient.get).mockResolvedValueOnce(mockReferrals);

    const result = await listPendingReferrals("remitida", signal);

    expect(result).toBe(mockReferrals);
    expect(httpClient.get).toHaveBeenCalledWith(
      `${ENDPOINTS.appointmentReferrals}?state=remitida`,
      signal,
    );
  });

  it("assigns schedule and allows modality update on a referred appointment", async () => {
    const payload: AssignAppointmentPayload = {
      psyId: 10,
      appDate: "2026-11-28T09:00:00-05:00",
      appDuration: 60,
      appType: "virtual",
    };
    const mockUpdated = { appId: 12, appState: "asignada", appType: "virtual" } as unknown as Appointment;
    vi.mocked(httpClient.patch).mockResolvedValueOnce(mockUpdated);

    const result = await assignAppointment(12, payload);

    expect(result).toBe(mockUpdated);
    expect(httpClient.patch).toHaveBeenCalledWith(
      ENDPOINTS.appointmentAssign(12),
      payload,
    );
  });
});

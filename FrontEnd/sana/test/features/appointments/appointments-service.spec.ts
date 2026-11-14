import { beforeEach, describe, expect, it, vi } from "vitest";
import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import { getPatientPsychologistHistory } from "@/features/appointments/services/appointments-service";

vi.mock("@/services/api/http-client", () => ({
  httpClient: {
    get: vi.fn(),
  },
}));

describe("appointments service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("loads psychologist streaks using the appointment's patient history endpoint", async () => {
    const history = [
      {
        psyId: 7,
        psychologistName: "Psicóloga",
        totalAppointments: 4,
        currentStreak: 3,
        lastAppointmentDate: "2026-11-12T10:00:00.000Z",
      },
    ];
    const signal = new AbortController().signal;
    vi.mocked(httpClient.get).mockResolvedValueOnce(history);

    await expect(getPatientPsychologistHistory(12, signal)).resolves.toBe(
      history,
    );
    expect(httpClient.get).toHaveBeenCalledWith(
      ENDPOINTS.appointmentPsychologistHistory(12),
      signal,
    );
  });
});

// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ConsultantFullRecordPage from "@/features/consultants/pages/consultant-full-record-page";
import { getConsultantForPsychologist } from "@/features/consultants/services/consultants-service";
import type { ConsultantFullRecord } from "@/features/consultants/types/consultant-types";

vi.mock("@/features/consultants/services/consultants-service", () => ({
  getConsultantForPsychologist: vi.fn(),
}));

const record: ConsultantFullRecord = {
  id: 10,
  fullName: "Tutor Ejemplo",
  identityDocument: "12345678",
  email: "tutor@example.com",
  phone: "3001234567",
  residence: null,
  status: "active",
  assignedPsychologistId: 20,
  assignedPsychologistName: null,
  lastAppointmentAt: null,
  appointmentCount: 2,
  completedAppointmentCount: 2,
  waitingAppointmentCount: 0,
  careRecords: [],
  appointments: [
    {
      id: 101,
      state: "realizada",
      appDate: "2026-10-22T15:00:00.000Z",
      duration: 60,
      reason: "Atención del tutor",
      patientType: "self",
      patientName: "Tutor Ejemplo",
      patientDependentId: null,
      clinicalNotes: [],
    },
    {
      id: 102,
      state: "realizada",
      appDate: "2026-10-22T16:00:00.000Z",
      duration: 60,
      reason: "Atención del dependiente",
      patientType: "dependent",
      patientName: "Menor Ejemplo",
      patientDependentId: 30,
      clinicalNotes: [
        { id: 501, observation: "Nota del dependiente", createdAt: "2026-10-22T17:00:00.000Z" },
      ],
    },
  ],
};

describe("ConsultantFullRecordPage patient records", () => {
  afterEach(() => cleanup());

  it("separates dependent appointments and notes from the requester's own history", async () => {
    vi.mocked(getConsultantForPsychologist).mockResolvedValue(record);

    render(<ConsultantFullRecordPage consultantId={10} />);

    expect(await screen.findByRole("heading", { name: "Consultante: Tutor Ejemplo" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Dependiente: Menor Ejemplo" })).toBeTruthy();
    expect(screen.getByText("Nota del dependiente")).toBeTruthy();
  });
});

import { format } from "date-fns";
import { describe, expect, it } from "vitest";
import {
  appointmentsToEvents,
  blocksToEvents,
  recurringBlocksToEvents,
} from "../../../src/features/schedule/lib/schedule-calendar";
import type {
  RecurringScheduleBlock,
  ScheduleBlock,
} from "../../../src/features/schedule/types/schedule-types";

describe("appointmentsToEvents", () => {
  it("overlays a confirmed appointment without replacing its availability", () => {
    const appointment = {
      appId: 7,
      appDate: "2026-07-14T10:00:00.000Z",
      appDuration: 60,
      appType: "presencial" as const,
      patientName: "Paciente de prueba",
    };
    const block: ScheduleBlock = {
      id: 2,
      date: "2026-07-14",
      startTime: "09:00:00",
      endTime: "11:00:00",
      appointmentId: appointment.appId,
    };

    const availabilityEvents = blocksToEvents([block]);
    const appointmentEvents = appointmentsToEvents([appointment]);

    expect(availabilityEvents).toHaveLength(1);
    expect(availabilityEvents[0].resource.kind).toBe("block");
    expect(format(availabilityEvents[0].start, "HH:mm")).toBe("09:00");
    expect(format(availabilityEvents[0].end, "HH:mm")).toBe("11:00");
    expect(appointmentEvents).toHaveLength(1);
    expect(appointmentEvents[0].resource.kind).toBe("appointment");
    expect(format(appointmentEvents[0].start, "HH:mm")).toBe("05:00");
    expect(format(appointmentEvents[0].end, "HH:mm")).toBe("06:00");
  });

  it("interprets timezone-less timestamps as Colombia local time", () => {
    const events = appointmentsToEvents([
      {
        appId: 9,
        appDate: "2026-07-14T05:00:00",
        appDuration: 60,
        appType: "virtual",
        patientName: "Paciente de prueba",
      },
    ]);

    expect(format(events[0].start, "HH:mm")).toBe("05:00");
    expect(format(events[0].end, "HH:mm")).toBe("06:00");
  });

  it("skips appointments without a valid interval", () => {
    expect(
      appointmentsToEvents([
        { appId: 1, appDate: null, appDuration: 30, appType: "virtual", patientName: "Test" },
        { appId: 2, appDate: "not-a-date", appDuration: 30, appType: "virtual", patientName: "Test" },
        { appId: 3, appDate: "2026-07-14T10:00:00Z", appDuration: null, appType: "virtual", patientName: "Test" },
      ]),
    ).toHaveLength(0);
  });
});

describe("recurringBlocksToEvents", () => {
  it("includes the final valid date of a recurring rule", () => {
    const rule: RecurringScheduleBlock = {
      id: 1,
      dayOfWeek: 1,
      startTime: "09:00:00",
      endTime: "10:00:00",
      validFrom: "2026-11-09",
      validUntil: "2026-11-09",
      active: true,
      hasAppointments: false,
    };
    const date = new Date(2026, 10, 9);

    const events = recurringBlocksToEvents([rule], date, date);

    expect(events).toHaveLength(1);
    expect(format(events[0].start, "yyyy-MM-dd")).toBe("2026-11-09");
  });

  it("does not render a recurring rule before its start date", () => {
    const rule: RecurringScheduleBlock = {
      id: 2,
      dayOfWeek: 1,
      startTime: "09:00:00",
      endTime: "10:00:00",
      validFrom: "2026-11-16",
      validUntil: null,
      active: true,
      hasAppointments: false,
    };
    const date = new Date(2026, 10, 9);

    expect(recurringBlocksToEvents([rule], date, date)).toHaveLength(0);
  });
});

import { describe, expect, it } from "vitest";
import {
  keepFutureSlotsForDay,
  psychologistsForDay,
  slotsForPsychologist,
} from "../../../src/features/appointments/lib/availability-calendar";
import type { AvailabilitySlot } from "../../../src/features/appointments/types/appointment-types";

/**
 * Representative availability data shared by the calendar helper tests.
 */
const slots: AvailabilitySlot[] = [
  {
    date: "2026-03-18",
    startTime: "09:00:00",
    endTime: "10:00:00",
    psychologists: [
      { id: 2, name: "Beatriz", speciality: "Infantil" },
      { id: 1, name: "Ana", speciality: "Clínica" },
    ],
  },
  {
    date: "2026-03-18",
    startTime: "10:00:00",
    endTime: "11:00:00",
    psychologists: [{ id: 1, name: "Ana", speciality: "Clínica" }],
  },
  {
    date: "2026-03-19",
    startTime: "11:00:00",
    endTime: "12:00:00",
    psychologists: [{ id: 3, name: "Carlos", speciality: "Familiar" }],
  },
];

describe("appointment availability calendar", () => {
  it("keeps only future slots from the selected date and orders them by time", () => {
    const now = Date.parse("2026-03-18T14:30:00.000Z");
    const result = keepFutureSlotsForDay(slots, "2026-03-18", now);

    expect(result.map((slot) => slot.startTime)).toEqual(["10:00:00"]);
  });

  it("lists each available psychologist once for the selected date", () => {
    expect(psychologistsForDay(slots.slice(0, 2)).map(({ id }) => id)).toEqual([
      1, 2,
    ]);
  });

  it("returns only slots that include the selected psychologist", () => {
    expect(slotsForPsychologist(slots, 2)).toEqual([slots[0]]);
  });
});

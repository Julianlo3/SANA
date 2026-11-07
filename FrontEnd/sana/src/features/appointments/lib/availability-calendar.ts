import { buildSlotDateTime } from "../services/appointments-service";
import type { AvailabilitySlot } from "../types/appointment-types";

/**
 * Required duration for appointments created from the assignment calendar.
 */
export const APPOINTMENT_DURATION_MINUTES = 60;

/**
 * Keeps future availability for one day and sorts it by start time.
 * @param slots Availability slots returned by the API.
 * @param day Selected date in YYYY-MM-DD format.
 * @param now Current timestamp in milliseconds.
 * @returns Future slots for the selected date, ordered by start time.
 */
export function keepFutureSlotsForDay(
  slots: AvailabilitySlot[],
  day: string,
  now = Date.now(),
): AvailabilitySlot[] {
  return slots
    .filter(
      (slot) =>
        slot.date.slice(0, 10) === day &&
        new Date(buildSlotDateTime(slot.date, slot.startTime)).getTime() >= now,
    )
    .sort((left, right) => left.startTime.localeCompare(right.startTime));
}

/**
 * Returns unique psychologists available in the supplied slots.
 * @param slots Availability slots for a single day.
 * @returns Psychologists sorted by name.
 */
export function psychologistsForDay(
  slots: AvailabilitySlot[],
): AvailabilitySlot["psychologists"] {
  const psychologists = new Map<
    number,
    AvailabilitySlot["psychologists"][number]
  >();

  for (const slot of slots) {
    for (const psychologist of slot.psychologists) {
      psychologists.set(psychologist.id, psychologist);
    }
  }

  return [...psychologists.values()].sort((left, right) =>
    left.name.localeCompare(right.name, "es"),
  );
}

/**
 * Filters availability to slots that include the selected psychologist.
 * @param slots Availability slots for a single day.
 * @param psychologistId Selected psychologist identifier.
 * @returns Slots available to the selected psychologist.
 */
export function slotsForPsychologist(
  slots: AvailabilitySlot[],
  psychologistId: number,
): AvailabilitySlot[] {
  return slots.filter((slot) =>
    slot.psychologists.some((psychologist) => psychologist.id === psychologistId),
  );
}

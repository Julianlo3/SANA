"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { buildSlotDateTime } from "@/lib/date/slot-datetime";
import { fetchConsultantAvailability } from "../services/consultation-requests-service";
import type { ConsultantAvailabilitySlot } from "../types/consultation-request-types";

/**
 * Normalizes slot dates and removes slots that have already started.
 * @param slots Availability slots returned by the API.
 * @returns Future slots with dates in YYYY-MM-DD format.
 */
function keepFutureSlots(
  slots: ConsultantAvailabilitySlot[],
): ConsultantAvailabilitySlot[] {
  const now = Date.now();

  return slots
    .map((slot) => ({ ...slot, date: slot.date.slice(0, 10) }))
    .filter(
      (slot) => Date.parse(buildSlotDateTime(slot.date, slot.startTime)) > now,
    );
}

/**
 * Loads and exposes public consultant availability for appointment forms.
 * @returns Availability data, loading/error state, reload handler, and selectors.
 */
export function useConsultantAvailability() {
  const [slots, setSlots] = useState<ConsultantAvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  /**
   * Resets the request state and reloads availability.
   * @returns Nothing.
   */
  const reload = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    /**
     * Fetches availability and updates the hook state.
     * @returns A promise that resolves when the request completes.
     */
    async function load() {
      try {
        const result = await fetchConsultantAvailability(controller.signal);
        if (controller.signal.aborted) return;
        setSlots(keepFutureSlots(result));
      } catch {
        if (controller.signal.aborted) return;
        setError("No pudimos cargar los horarios disponibles. Intenta de nuevo.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [reloadKey]);

  /**
   * Normalizes slot dates to YYYY-MM-DD format.
   * @returns Availability slots with normalized dates.
   */
  const normalizedSlots = useMemo(
    () => slots.map((slot) => ({ ...slot, date: slot.date.slice(0, 10) })),
    [slots],
  );

  /**
   * Builds the set of dates that contain at least one available slot.
   * @returns Available dates in YYYY-MM-DD format.
   */
  const availableDays = useMemo(
    () => new Set(normalizedSlots.map((slot) => slot.date)),
    [normalizedSlots],
  );

  /**
   * Returns the available slots for one date, ordered by start time.
   * @param day Date in YYYY-MM-DD format.
   * @returns Available slots for that date.
   */
  const slotsForDay = useCallback(
    (day: string): ConsultantAvailabilitySlot[] =>
      normalizedSlots
        .filter((s) => s.date === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [normalizedSlots],
  );

  return {
    slots,
    isLoading,
    error,
    reload,
    availableDays,
    slotsForDay,
  };
}

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getWeeklyAvailability,
  setAvailabilityBlock,
} from "../services/availability-service";
import type {
  DayShift,
  ShiftMode,
  WeekDay,
  WeeklyAvailability,
} from "../types/availability-block-types";

/** Lógica de la pantalla de disponibilidad del psicólogo. */
export function useWeeklyAvailability(psychologistId: number) {
  const [availability, setAvailability] = useState<WeeklyAvailability | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getWeeklyAvailability(psychologistId).then((result) => {
      if (isMounted) {
        setAvailability(result);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [psychologistId]);

  const toggleBlock = useCallback(
    async (dayOfWeek: WeekDay, shift: DayShift, nextMode: ShiftMode | null) => {
      setIsSaving(true);
      const updated = await setAvailabilityBlock(
        psychologistId,
        dayOfWeek,
        shift,
        nextMode,
      );
      setAvailability(updated);
      setIsSaving(false);
    },
    [psychologistId],
  );

  return { availability, isLoading, isSaving, toggleBlock };
}
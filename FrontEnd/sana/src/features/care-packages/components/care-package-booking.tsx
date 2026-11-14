"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { buildSlotDateTime } from "@/lib/date/slot-datetime";
import { ApiError } from "@/types/api-types";
import InlineMessage from "@/components/feedback/inline-message";
import Button from "@/components/ui/button";
import ConsultantSlotPicker from "@/features/consultation-requests/components/consultant-slot-picker";
import type { ConsultantAvailabilitySlot } from "@/features/consultation-requests/types/consultation-request-types";
import {
  bookCarePackageAppointment,
  getCarePackageAvailability,
} from "../services/care-packages-service";
import type { CarePackage } from "../types/care-package-types";

type Props = {
  /** Package whose availability is being scheduled. */
  readonly carePackage: CarePackage;
  /** Called after the booking has been accepted. */
  readonly onBooked: () => void;
};

/**
 * Loads package-scoped availability and books one session using the public calendar.
 * @param props Package data and booking completion callback.
 * @returns The package appointment booking controls.
 */
export default function CarePackageBooking({ carePackage, onBooked }: Props) {
  const [slots, setSlots] = useState<ConsultantAvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedSlot, setSelectedSlot] =
    useState<ConsultantAvailabilitySlot | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const availableSlots = useMemo(() => {
    return slots.map((slot) => ({ ...slot, date: slot.date.slice(0, 10) }));
  }, [slots]);
  const availableDays = useMemo(
    () => new Set(availableSlots.map((slot) => slot.date)),
    [availableSlots],
  );
  const slotsForDay = useCallback(
    (day: string) => availableSlots.filter((slot) => slot.date === day),
    [availableSlots],
  );

  useEffect(() => {
    const controller = new AbortController();

    getCarePackageAvailability(carePackage.id, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        const now = Date.now();
        setSlots(
          result
            .map((slot) => ({ ...slot, date: slot.date.slice(0, 10) }))
            .filter(
              (slot) =>
                Date.parse(
                  buildSlotDateTime(slot.date, slot.startTime),
                ) > now,
            ),
        );
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          requestError instanceof ApiError
            ? requestError.message
            : "No pudimos cargar los horarios disponibles.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [carePackage.id, reloadKey]);

  /**
   * Reloads package availability and clears the current selection.
   * @returns Nothing.
   */
  function reloadAvailability() {
    setIsLoading(true);
    setError(null);
    setSelectedSlot(null);
    setReloadKey((key) => key + 1);
  }

  /**
   * Books the selected slot against this package.
   * @returns A promise that resolves when the booking attempt finishes.
   */
  async function book() {
    if (!selectedSlot) {
      setActionError("Selecciona un horario disponible.");
      return;
    }

    setIsBooking(true);
    setActionError(null);
    try {
      await bookCarePackageAppointment(carePackage.id, {
        appDate: buildSlotDateTime(selectedSlot.date, selectedSlot.startTime),
      });
      onBooked();
    } catch (requestError: unknown) {
      setActionError(
        requestError instanceof ApiError
          ? requestError.message
          : "No pudimos solicitar la cita. Intenta de nuevo.",
      );
    } finally {
      setIsBooking(false);
    }
  }

  return (
    <div className="mt-5 space-y-4 rounded-2xl border border-border bg-surface-muted/40 p-4">
      <p className="text-xs text-text-muted">
        La sesión conservará la modalidad de tu valoración inicial.
      </p>
      <ConsultantSlotPicker
        availableDays={availableDays}
        slotsForDay={slotsForDay}
        isLoading={isLoading}
        error={error}
        onReload={reloadAvailability}
        selectedSlot={selectedSlot}
        onSelect={setSelectedSlot}
        disabled={isBooking}
      />

      {actionError && <InlineMessage tone="error">{actionError}</InlineMessage>}
      <Button onClick={book} disabled={!selectedSlot || isBooking}>
        {isBooking ? "Enviando…" : "Solicitar cita del paquete"}
      </Button>
    </div>
  );
}

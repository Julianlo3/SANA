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
  getFollowUpValuationAvailability,
  bookFollowUpValuation,
} from "../services/care-packages-service";
import type { CarePackage } from "../types/care-package-types";

type Props = {
  /** Package whose availability is being scheduled. */
  readonly carePackage: CarePackage;
  /** Uses the finalized-package valuation flow instead of a package session. */
  readonly followUpValuation?: boolean;
  /** Called after the booking has been accepted. */
  readonly onBooked: () => void;
};

/**
 * Converts follow-up valuation business errors into actionable messages.
 * @param error Error returned by the care-package API.
 * @returns A user-facing message describing the error.
 */
function followUpErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "No pudimos completar la solicitud. Intenta de nuevo.";
  }

  const messages: Record<string, string> = {
    ACTIVE_CARE_PACKAGE_EXISTS:
      "Este paciente tiene un paquete activo. Agenda sus sesiones desde ese paquete.",
    SUGGESTED_CARE_PACKAGE_PENDING:
      "Ya hay una sugerencia de paquete pendiente de revisión por secretaría.",
    VALUATION_ALREADY_IN_PROGRESS:
      "Este paciente ya tiene una valoración en curso.",
    NEWER_CARE_PACKAGE_EXISTS:
      "Solicita la valoración desde el paquete finalizado más reciente.",
    CARE_PACKAGE_NOT_FINALIZED:
      "Este paquete ya no está finalizado. Actualiza tus paquetes e inténtalo de nuevo.",
    SCHEDULE_SLOT_TAKEN:
      "Ese horario acaba de ocuparse. Actualiza la disponibilidad y elige otro.",
    INVALID_APPOINTMENT_DATE:
      "La fecha seleccionada ya pasó. Elige un horario futuro.",
    PSYCHOLOGIST_NOT_AVAILABLE:
      "El psicólogo tratante no está disponible actualmente. Comunícate con secretaría.",
  };

  return messages[error.code ?? ""] ?? error.message;
}

/**
 * Loads package-scoped availability and books one session using the public calendar.
 * @param props Package data and booking completion callback.
 * @returns The package appointment booking controls.
 */
export default function CarePackageBooking({
  carePackage,
  followUpValuation = false,
  onBooked,
}: Props) {
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

    (followUpValuation
      ? getFollowUpValuationAvailability(carePackage.id, controller.signal)
      : getCarePackageAvailability(carePackage.id, controller.signal))
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
        setError(followUpValuation
          ? followUpErrorMessage(requestError)
          : requestError instanceof ApiError
            ? requestError.message
            : "No pudimos cargar los horarios disponibles.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [carePackage.id, followUpValuation, reloadKey]);

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
      const appDate = buildSlotDateTime(
        selectedSlot.date,
        selectedSlot.startTime,
      );
      if (followUpValuation) {
        await bookFollowUpValuation(carePackage.id, { appDate });
      } else {
        await bookCarePackageAppointment(carePackage.id, { appDate });
      }
      onBooked();
    } catch (requestError: unknown) {
      setActionError(followUpValuation
        ? followUpErrorMessage(requestError)
        : requestError instanceof ApiError
          ? requestError.message
          : "No pudimos solicitar la cita. Intenta de nuevo.",
      );
      if (
        followUpValuation &&
        requestError instanceof ApiError &&
        requestError.code === "SCHEDULE_SLOT_TAKEN"
      ) {
        setSelectedSlot(null);
        reloadAvailability();
      }
    } finally {
      setIsBooking(false);
    }
  }

  return (
    <div className="mt-5 space-y-4 rounded-2xl border border-border bg-surface-muted/40 p-4">
      <p className="text-xs text-text-muted">
        {followUpValuation
          ? `La nueva valoración será atendida por ${carePackage.psychologistName ?? "el psicólogo tratante"} y conservará la modalidad anterior.`
          : "La sesión conservará la modalidad de tu valoración inicial."}
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
        {isBooking
          ? "Enviando…"
          : followUpValuation
            ? "Agendar valoración de continuidad"
            : "Solicitar cita del paquete"}
      </Button>
    </div>
  );
}

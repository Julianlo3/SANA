"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarClock, CheckCircle2 } from "lucide-react";
import ConsultantSlotPicker from "./consultant-slot-picker";
import { useConsultantAvailability } from "../hooks/use-consultant-availability";
import type { ConsultantAvailabilitySlot } from "../types/consultation-request-types";

/**
 * Parses a YYYY-MM-DD value as a local calendar date.
 * @param dateStr Date string.
 * @returns The corresponding local date.
 */
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Removes seconds from an API time value.
 * @param time Time in HH:mm or HH:mm:ss format.
 * @returns Time in HH:mm format.
 */
function fmtTime(time: string): string {
  return time.slice(0, 5);
}

/**
 * Props for the evaluation appointment slot section.
 */
type Props = {
  /** Currently selected evaluation slot. */
  selectedSlot: ConsultantAvailabilitySlot | null;
  /** Updates or clears the selected slot. */
  onSelect: (slot: ConsultantAvailabilitySlot | null) => void;
  /** Form validation error for the required slot. */
  error?: string;
  /** Disables slot selection. */
  disabled?: boolean;
};

/**
 * Renders availability and selection controls for an evaluation appointment.
 * @param props Selected slot, handlers, validation error, and disabled state.
 * @returns The evaluation appointment section.
 */
export default function EvaluationAppointmentSection({
  selectedSlot,
  onSelect,
  error,
  disabled = false,
}: Props) {
  const { availableDays, slotsForDay, isLoading, error: loadError, reload } =
    useConsultantAvailability();

  return (
    <fieldset className="space-y-4">
      <legend className="sr-only">Cita de evaluación</legend>

      {/* Section heading. */}
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <CalendarClock size={18} aria-hidden />
        </span>
        <div>
          <span className="block text-xs font-bold uppercase tracking-wider text-primary">
            Primera cita
          </span>
          <h3 className="mt-0.5 text-sm font-semibold text-text">
            Cita de evaluación
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-text-muted">
            Selecciona el horario que mejor se adapte a tu disponibilidad. Las
            citas de evaluación tienen una duración de{" "}
            <strong>1 hora</strong>. El profesional se asignará una vez
            confirmada tu solicitud.
          </p>
        </div>
      </div>

      {/* Calendar and available slot buttons. */}
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <ConsultantSlotPicker
          availableDays={availableDays}
          slotsForDay={slotsForDay}
          isLoading={isLoading}
          error={loadError}
          onReload={reload}
          selectedSlot={selectedSlot}
          onSelect={onSelect}
          disabled={disabled}
        />
      </div>

      {/* Summary of the selected slot. */}
      {selectedSlot && (
        <div className="flex items-start gap-2 rounded-xl border border-primary/30 bg-primary-soft/30 px-4 py-3">
          <CheckCircle2
            size={16}
            className="mt-0.5 shrink-0 text-primary"
            aria-hidden
          />
          <p className="text-sm text-text">
            <span className="font-semibold">Has seleccionado: </span>
            <span className="capitalize">
              {format(parseLocalDate(selectedSlot.date), "EEEE d 'de' MMMM", {
                locale: es,
              })}
            </span>
            {" · "}
            {fmtTime(selectedSlot.startTime)}–{fmtTime(selectedSlot.endTime)}
          </p>
        </div>
      )}

      {/* Required slot validation error. */}
      {error && !selectedSlot && (
        <span role="alert" className="block text-xs text-danger">
          {error}
        </span>
      )}
    </fieldset>
  );
}

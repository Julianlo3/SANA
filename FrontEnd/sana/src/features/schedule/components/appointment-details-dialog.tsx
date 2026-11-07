"use client";

import { useEffect, useRef } from "react";
import { Clock3, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { CalendarEvent } from "../types/calendar-types";

/**
 * Props for the confirmed appointment details dialog.
 */
type Props = {
  /** Appointment event displayed in the dialog. */
  event: CalendarEvent;
  /** Closes the dialog. */
  onClose: () => void;
};

/**
 * Formats a date with its localized weekday and full date.
 * @param date Date to format.
 * @returns Localized long date.
 */
function formatLongDate(date: Date): string {
  return format(date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
}

/**
 * Renders centered appointment details in a modal dialog.
 * @param props Appointment event and close handler.
 * @returns The appointment dialog, or null for non-appointment events.
 */
export default function AppointmentDetailsDialog({ event, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  if (event.resource.kind !== "appointment") return null;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="appointment-dialog-title"
      className="appointment-details-dialog w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-2xl border border-border bg-surface p-0 text-text shadow-2xl"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex items-start gap-4 p-5 sm:p-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Clock3 size={20} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            Cita confirmada
          </p>
          <h2
            id="appointment-dialog-title"
            className="mt-1 break-words font-display text-xl font-bold text-primary-dark"
          >
            {event.resource.patientName ?? "Cita confirmada"}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalle de cita"
          className="rounded-lg p-2 text-text-subtle transition hover:bg-surface-muted hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <X size={18} aria-hidden />
        </button>
      </div>

      <div className="space-y-3 px-5 pb-6 sm:px-6">
        <p className="capitalize text-sm font-medium text-text-muted">
          {formatLongDate(event.start)}
        </p>
        <p className="text-base font-semibold text-text">
          {format(event.start, "HH:mm")}–{format(event.end, "HH:mm")}
        </p>
        {event.resource.mode && (
          <span className="inline-flex rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold capitalize text-text">
            {event.resource.mode}
          </span>
        )}
      </div>
    </dialog>
  );
}

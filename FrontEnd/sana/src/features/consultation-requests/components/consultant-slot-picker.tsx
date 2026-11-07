"use client";

import { useMemo, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isToday,
  startOfDay,
  addMonths,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { getColombiaToday } from "@/lib/date/slot-datetime";
import type { ConsultantAvailabilitySlot } from "../types/consultation-request-types";

/**
 * Removes seconds from an API time value.
 * @param time Time in HH:mm or HH:mm:ss format.
 * @returns Time in HH:mm format.
 */
function fmtTime(time: string): string {
  return time.slice(0, 5);
}

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
 * Props for the public consultant availability picker.
 */
type Props = {
  /** Dates with availability returned by the backend. */
  availableDays: Set<string>;
  /** Returns the available slots for a date. */
  slotsForDay: (day: string) => ConsultantAvailabilitySlot[];
  /** Indicates whether availability is loading. */
  isLoading: boolean;
  /** Availability request error, if any. */
  error: string | null;
  /** Retries the availability request. */
  onReload: () => void;
  /** Currently selected slot. */
  selectedSlot: ConsultantAvailabilitySlot | null;
  /** Updates or clears the selected slot. */
  onSelect: (slot: ConsultantAvailabilitySlot | null) => void;
  /** Disables calendar interactions. */
  disabled?: boolean;
};

/**
 * Renders the public calendar and slot selection controls.
 * @param props Availability data, selection state, and interaction handlers.
 * @returns The consultant availability picker.
 */
export default function ConsultantSlotPicker({
  availableDays,
  slotsForDay,
  isLoading,
  error,
  onReload,
  selectedSlot,
  onSelect,
  disabled = false,
}: Props) {
  const [year, month, day] = getColombiaToday().split("-").map(Number);
  const today = startOfDay(new Date(year, month - 1, day));
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(today));
  const [selectedDay, setSelectedDay] = useState<string | null>(
    selectedSlot?.date ?? null,
  );
  const latestAvailableMonth = [...availableDays].sort().at(-1)?.slice(0, 7);
  const canGoToNextMonth =
    latestAvailableMonth !== undefined &&
    format(currentMonth, "yyyy-MM") < latestAvailableMonth;

  // Build complete Monday-to-Sunday weeks for the visible month.
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const slots = selectedDay ? slotsForDay(selectedDay) : [];

  /**
   * Selects an available date in the calendar.
   * @param day Date selected by the user.
   * @returns Nothing.
   */
  function handleDayClick(day: Date) {
    if (disabled) return;
    const key = format(day, "yyyy-MM-dd");
    if (!availableDays.has(key)) return;
    if (selectedSlot?.date !== key) onSelect(null);
    setSelectedDay(key);
  }

  /**
   * Navigates to the previous month.
   * @returns Nothing.
   */
  function prevMonth() {
    setCurrentMonth((m) => subMonths(m, 1));
  }

  /**
   * Navigates to the next month with available dates.
   * @returns Nothing.
   */
  function nextMonth() {
    setCurrentMonth((m) => addMonths(m, 1));
  }

  // Render the loading placeholder.
  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-surface-muted" />
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-9 rounded-lg bg-surface-muted" />
          ))}
        </div>
      </div>
    );
  }

  // Render the request error and retry action.
  if (error) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
        <p>{error}</p>
        <button
          type="button"
          onClick={onReload}
          className="mt-2 font-semibold underline hover:no-underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Visible month header. */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          disabled={disabled || isSameMonth(currentMonth, today)}
          aria-label="Mes anterior"
          className="rounded-lg p-1.5 text-text-muted transition hover:bg-surface-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft size={18} aria-hidden />
        </button>

        <span className="text-sm font-semibold capitalize text-text">
          {format(currentMonth, "MMMM yyyy", { locale: es })}
        </span>

        <button
          type="button"
          onClick={nextMonth}
          disabled={disabled || !canGoToNextMonth}
          aria-label="Mes siguiente"
          className="rounded-lg p-1.5 text-text-muted transition hover:bg-surface-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight size={18} aria-hidden />
        </button>
      </div>

      {/* Weekday headers. */}
      <div className="grid grid-cols-7 text-center">
        {["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"].map((d) => (
          <span key={d} className="pb-1 text-xs font-semibold text-text-subtle">
            {d}
          </span>
        ))}

        {/* Calendar date cells. */}
        {calendarDays.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, currentMonth);
          const hasSlots = availableDays.has(key);
          const isSelected = selectedDay === key;
          const isHighlighted = hasSlots && inMonth;

          return (
            <button
              key={key}
              type="button"
              disabled={disabled || !isHighlighted}
              onClick={() => handleDayClick(day)}
              aria-pressed={isSelected}
              aria-label={format(day, "d 'de' MMMM", { locale: es })}
              className={[
                "relative mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm transition",
                !inMonth && "invisible",
                inMonth && !hasSlots && "cursor-not-allowed text-text-subtle opacity-40",
                isHighlighted && !isSelected && "cursor-pointer font-medium text-text hover:bg-primary/10 hover:text-primary",
                isSelected && "cursor-pointer bg-primary font-semibold text-white shadow-sm",
                isToday(day) && !isSelected && "ring-1 ring-primary/50",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {format(day, "d")}
              {/* Availability indicator. */}
              {isHighlighted && !isSelected && (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary/60" />
              )}
            </button>
          );
        })}
      </div>

      {availableDays.size === 0 && (
        <p
          role="status"
          className="rounded-xl border border-border bg-surface-muted px-4 py-4 text-center text-sm text-text-muted"
        >
          No hay horarios disponibles para los próximos 30 días.
        </p>
      )}

      {/* Slots for the selected date. */}
      {selectedDay && (
        <div className="space-y-2 pt-1">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
            <Clock size={13} aria-hidden />
            {format(parseLocalDate(selectedDay), "EEEE d 'de' MMMM", {
              locale: es,
            })}
          </p>

          {slots.length === 0 ? (
            <p className="rounded-xl border border-border bg-surface-muted px-4 py-4 text-center text-sm text-text-muted">
              No hay horarios disponibles para este día.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => {
                const isChosen =
                  selectedSlot?.date === slot.date &&
                  selectedSlot?.startTime === slot.startTime;

                return (
                  <button
                    key={`${slot.date}|${slot.startTime}`}
                    type="button"
                    disabled={disabled}
                    aria-pressed={isChosen}
                    onClick={() => onSelect(slot)}
                    className={[
                      "rounded-full border px-4 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed",
                      isChosen
                        ? "border-primary bg-primary text-white shadow-sm"
                        : "border-border bg-surface text-text-muted hover:border-primary hover:text-primary",
                    ].join(" ")}
                  >
                    {fmtTime(slot.startTime)} – {fmtTime(slot.endTime)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

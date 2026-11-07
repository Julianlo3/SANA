"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import { ApiError } from "@/types/api-types";
import {
  colombiaToday,
  formatSlotTime,
} from "../lib/appointment-format";
import {
  APPOINTMENT_DURATION_MINUTES,
  keepFutureSlotsForDay,
  psychologistsForDay,
  slotsForPsychologist,
} from "../lib/availability-calendar";
import {
  buildSlotDateTime,
  findAvailability,
  findPublicAvailability,
} from "../services/appointments-service";
import type {
  AvailabilitySlot,
  PublicAvailabilitySlot,
} from "../types/appointment-types";

/**
 * Selected one-hour slot and psychologist for appointment assignment.
 */
export type SlotSelection = {
  /** Selected availability interval. */
  slot: AvailabilitySlot;
  /** Identifier of the psychologist assigned to the slot. */
  psychologistId: number;
  /** Appointment length in minutes. */
  duration: number;
};

/**
 * Props required by the appointment slot calendar.
 */
type Props = {
  /** Initial calendar date in YYYY-MM-DD format. */
  readonly defaultDate: string;
  /** Current slot and psychologist selection. */
  readonly selection: SlotSelection | null;
  /** Updates or clears the current selection. */
  readonly onSelect: (selection: SlotSelection | null) => void;
  /** Disables all calendar and selection interactions. */
  readonly disabled?: boolean;
};

/**
 * Parses a YYYY-MM-DD value as a local calendar date.
 * @param date Date string.
 * @returns The corresponding local date.
 */
function parseLocalDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Converts an API error into a user-facing message.
 * @param error Caught value.
 * @param fallback Message used for non-API errors.
 * @returns The API message or fallback text.
 */
function apiErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

/**
 * Checks whether a slot starts at or after the supplied timestamp.
 * @param slot Availability slot to inspect.
 * @param now Current timestamp in milliseconds.
 * @returns Whether the slot is still available in time.
 */
function isSlotInFuture(slot: PublicAvailabilitySlot, now: number): boolean {
  return new Date(buildSlotDateTime(slot.date, slot.startTime)).getTime() >= now;
}

/**
 * Returns the calendar status message for the current month query.
 * @param isLoading Whether the availability request is pending.
 * @param error Request error, if any.
 * @param slotCount Number of available slots returned.
 * @returns The status message, or an empty string when an error is shown.
 */
function getMonthStatusText(
  isLoading: boolean,
  error: string | null,
  slotCount: number,
): string {
  if (isLoading) return "Cargando disponibilidad…";
  if (error) return "";
  if (slotCount === 0) return "No hay disponibilidad en este mes.";
  return "Los puntos indican días con horarios disponibles.";
}

/**
 * Renders the availability calendar and the psychologist/slot assignment flow.
 * @param props Calendar date, current selection, selection handler, and disabled state.
 * @returns The interactive appointment availability picker.
 */
export default function SlotPicker({
  defaultDate,
  selection,
  onSelect,
  disabled = false,
}: Props) {
  const today = colombiaToday();
  const [currentMonth, setCurrentMonth] = useState(() =>
    startOfMonth(parseLocalDate(defaultDate)),
  );
  const [monthSlots, setMonthSlots] = useState<PublicAvailabilitySlot[]>([]);
  const [isLoadingMonth, setIsLoadingMonth] = useState(true);
  const [monthError, setMonthError] = useState<string | null>(null);
  const [monthReload, setMonthReload] = useState(0);

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [daySlots, setDaySlots] = useState<AvailabilitySlot[] | null>(null);
  const [isLoadingDay, setIsLoadingDay] = useState(false);
  const [dayError, setDayError] = useState<string | null>(null);
  const [dayReload, setDayReload] = useState(0);
  const [selectedPsychologistId, setSelectedPsychologistId] = useState<
    number | null
  >(null);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const availableDays = useMemo(
    () => new Set(monthSlots.map((slot) => slot.date.slice(0, 10))),
    [monthSlots],
  );

  const psychologists = useMemo(
    () => psychologistsForDay(daySlots ?? []),
    [daySlots],
  );

  const psychologistSlots = useMemo(
    () =>
      daySlots && selectedPsychologistId !== null
        ? slotsForPsychologist(daySlots, selectedPsychologistId)
        : [],
    [daySlots, selectedPsychologistId],
  );

  useEffect(() => {
    const controller = new AbortController();
    const firstDay = startOfMonth(currentMonth);
    const lastDay = endOfMonth(currentMonth);
    const monthStart = format(firstDay, "yyyy-MM-dd");
    const monthEnd = format(lastDay, "yyyy-MM-dd");

    const queries = [
      findPublicAvailability(
        {
          appointmentStart: buildSlotDateTime(monthStart, "00:00"),
          duration: APPOINTMENT_DURATION_MINUTES,
          delayHours: 720,
        },
        controller.signal,
      ),
    ];

    if (lastDay.getDate() - firstDay.getDate() + 1 > 30) {
      queries.push(
        findPublicAvailability(
          {
            appointmentStart: buildSlotDateTime(monthEnd, "00:00"),
            duration: APPOINTMENT_DURATION_MINUTES,
            delayHours: 24,
          },
          controller.signal,
        ),
      );
    }

    Promise.all(queries)
      .then((results) => {
        if (controller.signal.aborted) return;
        const now = Date.now();
        const uniqueSlots = new Map<string, PublicAvailabilitySlot>();

        for (const slot of results.flat()) {
          const day = slot.date.slice(0, 10);
          if (
            day < monthStart ||
            day > monthEnd ||
            day < today ||
            !isSlotInFuture(slot, now)
          ) {
            continue;
          }

          uniqueSlots.set(
            `${day}|${slot.startTime}|${slot.endTime}`,
            { ...slot, date: day },
          );
        }

        setMonthSlots([...uniqueSlots.values()]);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setMonthSlots([]);
        setMonthError(
          apiErrorMessage(
            error,
            "No pudimos cargar la disponibilidad del calendario.",
          ),
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingMonth(false);
      });

    return () => controller.abort();
  }, [currentMonth, monthReload, today]);

  useEffect(() => {
    if (!selectedDay) return;

    const controller = new AbortController();

    findAvailability(
      {
        appointmentStart:
          selectedDay === today
            ? new Date().toISOString()
            : buildSlotDateTime(selectedDay, "00:00"),
        duration: APPOINTMENT_DURATION_MINUTES,
        delayHours: 24,
      },
      controller.signal,
    )
      .then((result) => {
        if (controller.signal.aborted) return;
        setDaySlots(keepFutureSlotsForDay(result, selectedDay));
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setDaySlots([]);
        setDayError(
          apiErrorMessage(
            error,
            "No pudimos cargar los psicólogos disponibles para este día.",
          ),
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingDay(false);
      });

    return () => controller.abort();
  }, [dayReload, selectedDay, today]);

  /**
   * Selects an available date and starts its psychologist lookup.
   * @param day Date selected in the calendar.
   * @returns Nothing.
   */
  function selectDay(day: Date) {
    const key = format(day, "yyyy-MM-dd");
    if (disabled || isLoadingMonth || !availableDays.has(key)) return;
    setSelectedDay(key);
    setSelectedPsychologistId(null);
    setDaySlots(null);
    setDayError(null);
    setIsLoadingDay(true);
    onSelect(null);
  }

  /**
   * Selects a psychologist and clears a slot from another psychologist.
   * @param id Selected psychologist identifier.
   * @returns Nothing.
   */
  function selectPsychologist(id: number) {
    if (disabled) return;
    setSelectedPsychologistId(id);
    if (selection?.psychologistId !== id) onSelect(null);
  }

  /**
   * Changes the visible month and clears the previous date selection.
   * @param month New month to display.
   * @returns Nothing.
   */
  function changeMonth(month: Date) {
    if (disabled) return;
    setIsLoadingMonth(true);
    setMonthError(null);
    setMonthSlots([]);
    setSelectedDay(null);
    setSelectedPsychologistId(null);
    setDaySlots(null);
    setDayError(null);
    setIsLoadingDay(false);
    onSelect(null);
    setCurrentMonth(startOfMonth(month));
  }

  /**
   * Retries the anonymized availability request for the visible month.
   * @returns Nothing.
   */
  function retryMonth() {
    setIsLoadingMonth(true);
    setMonthError(null);
    setMonthSlots([]);
    setSelectedDay(null);
    setSelectedPsychologistId(null);
    setDaySlots(null);
    setDayError(null);
    setIsLoadingDay(false);
    onSelect(null);
    setMonthReload((value) => value + 1);
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-text-subtle">
        El calendario resume los días con disponibilidad general. Al elegir un
        día podrás ver los psicólogos y sus franjas libres de 1 hora.
      </p>

      <section
        aria-label="Calendario de disponibilidad"
        className="mx-auto max-w-md rounded-xl border border-border bg-surface p-4"
      >
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => changeMonth(subMonths(currentMonth, 1))}
            disabled={
              disabled ||
              format(currentMonth, "yyyy-MM") <=
                format(startOfMonth(parseLocalDate(today)), "yyyy-MM")
            }
            aria-label="Mes anterior"
            className="rounded-lg p-2 text-text-muted transition hover:bg-surface-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft size={18} aria-hidden />
          </button>
          <h3 className="text-sm font-semibold capitalize text-text">
            {format(currentMonth, "MMMM yyyy", { locale: es })}
          </h3>
          <button
            type="button"
            onClick={() => changeMonth(addMonths(currentMonth, 1))}
            disabled={disabled}
            aria-label="Mes siguiente"
            className="rounded-lg p-2 text-text-muted transition hover:bg-surface-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight size={18} aria-hidden />
          </button>
        </div>

        <div className="grid grid-cols-7 text-center">
          {["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"].map((weekday) => (
            <span
              key={weekday}
              className="pb-2 text-xs font-semibold text-text-subtle"
            >
              {weekday}
            </span>
          ))}

          {calendarDays.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const inMonth = isSameMonth(day, currentMonth);
            const hasAvailability = availableDays.has(key);
            const selected = selectedDay === key;
            const isPast = key < today;

            return (
              <button
                key={key}
                type="button"
                disabled={
                  disabled ||
                  !inMonth ||
                  isPast ||
                  !hasAvailability ||
                  isLoadingMonth ||
                  Boolean(monthError)
                }
                onClick={() => selectDay(day)}
                aria-pressed={selected}
                aria-label={
                  hasAvailability
                    ? `Disponibilidad el ${format(day, "d 'de' MMMM", { locale: es })}`
                    : format(day, "d 'de' MMMM", { locale: es })
                }
                className={[
                  "relative mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm transition",
                  !inMonth && "invisible",
                  inMonth &&
                    !hasAvailability &&
                    "cursor-not-allowed text-text-subtle opacity-40",
                  inMonth &&
                    hasAvailability &&
                    !selected &&
                    "cursor-pointer font-medium text-primary hover:bg-primary/10",
                  selected && "bg-primary font-semibold text-white shadow-sm",
                  isToday(day) && !selected && "ring-1 ring-primary/50",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {format(day, "d")}
                {hasAvailability && !selected && (
                  <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        <output
          aria-live="polite"
          className="mt-3 block min-h-5 text-center text-xs text-text-subtle"
        >
          {getMonthStatusText(isLoadingMonth, monthError, monthSlots.length)}
        </output>
      </section>

      {monthError && (
        <InlineMessage tone="error">
          <span>{monthError} </span>
          <button
            type="button"
            onClick={retryMonth}
            className="font-semibold underline"
          >
            Reintentar
          </button>
        </InlineMessage>
      )}

      {selectedDay && (
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold capitalize text-text">
            <Clock3 size={16} aria-hidden />
            {format(parseLocalDate(selectedDay), "EEEE d 'de' MMMM", {
              locale: es,
            })}
          </h3>

          {isLoadingDay && (
            <output aria-live="polite" className="text-sm text-text-muted">
              Buscando psicólogos disponibles…
            </output>
          )}

          {dayError && (
            <InlineMessage tone="error">
              <span>{dayError} </span>
              <button
                type="button"
                onClick={() => {
                  setIsLoadingDay(true);
                  setDayError(null);
                  setDayReload((value) => value + 1);
                }}
                className="font-semibold underline"
              >
                Reintentar
              </button>
            </InlineMessage>
          )}

          {!isLoadingDay && !dayError && daySlots?.length === 0 && (
            <output
              aria-live="polite"
              className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-text-muted"
            >
              Ya no hay horarios disponibles para este día. Elige otra fecha.
            </output>
          )}

          {daySlots && daySlots.length > 0 && (
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Psicólogos disponibles
                </p>
                <div className="flex flex-wrap gap-2">
                  {psychologists.map((psychologist) => {
                    const selected = selectedPsychologistId === psychologist.id;

                    return (
                      <button
                        key={psychologist.id}
                        type="button"
                        disabled={disabled}
                        aria-pressed={selected}
                        onClick={() => selectPsychologist(psychologist.id)}
                        className={`rounded-full border px-4 py-2 text-left text-sm transition disabled:cursor-not-allowed ${
                          selected
                            ? "border-primary bg-primary text-white"
                            : "border-border bg-surface text-text hover:border-primary hover:text-primary"
                        }`}
                      >
                        <span className="font-semibold">{psychologist.name}</span>{" "}
                        {psychologist.speciality && (
                          <span className="ml-1 text-xs opacity-80">
                            · {psychologist.speciality}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedPsychologistId !== null && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Horarios disponibles · 1 hora
                  </p>
                  {psychologistSlots.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {psychologistSlots.map((slot) => {
                        const selected =
                          selection?.psychologistId === selectedPsychologistId &&
                          selection.slot.date === slot.date &&
                          selection.slot.startTime === slot.startTime;

                        return (
                          <button
                            key={`${slot.date}|${slot.startTime}`}
                            type="button"
                            disabled={disabled}
                            aria-pressed={selected}
                            onClick={() =>
                              onSelect({
                                slot,
                                psychologistId: selectedPsychologistId,
                                duration: APPOINTMENT_DURATION_MINUTES,
                              })
                            }
                            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed ${
                              selected
                                ? "border-primary bg-primary text-white"
                                : "border-border bg-surface text-text hover:border-primary hover:text-primary"
                            }`}
                          >
                            {formatSlotTime(slot.startTime)} –{" "}
                            {formatSlotTime(slot.endTime)}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-text-muted">
                      Este psicólogo ya no tiene horarios disponibles para el
                      día elegido.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

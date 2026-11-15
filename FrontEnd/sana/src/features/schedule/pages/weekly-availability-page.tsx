"use client";

import type { ComponentType } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  type CalendarProps,
  type DateHeaderProps,
  type EventPropGetter,
  type HeaderProps,
  type SlotInfo,
  type View,
} from "react-big-calendar";
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  getISODay,
  isSameDay,
  parse,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { Clock3, LockKeyhole, Repeat, Trash2 } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import PolicyMarkdown from "@/components/legal/policy-markdown";
import "../styles/calendar-overrides.css";
import InlineMessage from "@/components/feedback/inline-message";
import Button from "@/components/ui/button";
import { useMyAppointments } from "@/features/my-appointments/hooks/use-my-appointments";
import AppointmentDetailsDialog from "../components/appointment-details-dialog";
import { useScheduleBlocks } from "../hooks/use-schedule-blocks";
import { useScheduleTerms } from "../hooks/use-schedule-terms";
import {
  appointmentsToEvents,
  blocksToEvents,
  recurringBlocksToEvents,
} from "../lib/schedule-calendar";
import type {
  CreateRecurringScheduleBlockPayload,
  CreateScheduleBlockPayload,
} from "../types/schedule-types";
import type { CalendarEvent } from "../types/calendar-types";

/**
 * Spanish weekday labels indexed by ISO weekday number.
 */
const DAY_LABELS: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

/**
 * Monday-first date-fns localizer for the Spanish calendar.
 */
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { es },
});

/**
 * Background colors for one-time and recurring availability events.
 */
const AVAILABILITY_COLORS = {
  block: "#edb6c7",
  recurring: "#9fd3d8",
} as const;

/**
 * Calendar component type extended with background event styling support.
 */
const CalendarWithBackgroundStyles = BigCalendar as ComponentType<
  CalendarProps<CalendarEvent> & {
    backgroundEventPropGetter?: EventPropGetter<CalendarEvent>;
  }
>;

/**
 * Availability editor mode shown below the calendar.
 */
type FormMode = "none" | "block" | "recurring";

/**
 * Renders the weekday number and abbreviated name in a calendar header.
 * @param props Calendar header date and label.
 * @returns The custom weekday header.
 */
function CalendarDayHeader({ date, label }: HeaderProps) {
  return (
    <span className="schedule-day-header" aria-label={label}>
      <span className="schedule-day-number">{format(date, "d")}</span>
      <span className="schedule-day-name">
        {format(date, "EEE", { locale: es })}
      </span>
    </span>
  );
}

/**
 * Renders a month date header with past dates visually muted.
 * @param props Calendar date and localized label.
 * @returns The custom month date header.
 */
function CalendarMonthDateHeader({ date, label }: DateHeaderProps) {
  const isPast = dateKey(date) < dateKey(new Date());
  return (
    <span className={isPast ? "schedule-past-month-day" : undefined}>
      {label}
    </span>
  );
}

/**
 * Initial values for a one-time availability form.
 */
const EMPTY_BLOCK_FORM: CreateScheduleBlockPayload = {
  date: "",
  startTime: "",
  endTime: "",
};

/**
 * Initial values for a recurring availability form.
 */
const EMPTY_RECURRING_FORM: CreateRecurringScheduleBlockPayload = {
  dayOfWeek: 1,
  startTime: "",
  endTime: "",
  validFrom: "",
};

/**
 * Formats a date as a stable calendar key.
 * @param date Date to format.
 * @returns Date in YYYY-MM-DD format.
 */
function dateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Formats a date as a localized long weekday and date.
 * @param date Date to format.
 * @returns Localized long date.
 */
function formatLongDate(date: Date): string {
  return format(date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
}

/**
 * Formats a date value returned by the schedule API.
 * @param date Stored date string.
 * @returns Localized date without time-zone conversion.
 */
function formatStoredDate(date: string): string {
  const [year, month, day] = date.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

/**
 * Gets the date range represented by the active calendar view.
 * @param date Current calendar date.
 * @param view Active calendar view.
 * @returns Inclusive visible range.
 */
function visibleCalendarRange(date: Date, view: View) {
  if (view === "month") {
    return {
      start: startOfWeek(startOfMonth(date), { weekStartsOn: 1 }),
      end: endOfWeek(endOfMonth(date), { weekStartsOn: 1 }),
    };
  }

  if (view === "day") {
    return { start: startOfDay(date), end: endOfDay(date) };
  }

  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

/**
 * Builds event styles including past and focused appointment states.
 * @param event Calendar event to style.
 * @param now Current time used to detect past events.
 * @param focusedAppointmentId Identifier of the focused appointment.
 * @returns Calendar event style properties.
 */
function eventStyle(
  event: CalendarEvent,
  now: Date,
  focusedAppointmentId: number | null,
) {
  const isAppointment = event.resource.kind === "appointment";
  const isFocused = isFocusedAppointment(event, focusedAppointmentId);
  let zIndex = 1;
  if (isAppointment) zIndex = 4;
  if (isFocused) zIndex = 6;
  const colors: Record<CalendarEvent["resource"]["kind"], string> = {
    block: AVAILABILITY_COLORS.block,
    recurring: AVAILABILITY_COLORS.recurring,
    appointment: "#134176",
  };
  const isPast = event.end.getTime() < now.getTime();
  return {
    style: {
      backgroundColor: colors[event.resource.kind],
      borderRadius: "10px",
      border:
        isAppointment
          ? "2px solid white"
          : "1px solid rgba(19, 65, 118, 0.12)",
      color: isAppointment ? "white" : "#26384d",
      fontSize: "0.75rem",
      padding: "2px 6px",
      opacity: isPast ? 0.4 : 1,
      filter: isPast ? "grayscale(0.65)" : undefined,
      outline: isFocused ? "3px solid #f4c95d" : undefined,
      outlineOffset: isFocused ? "2px" : undefined,
      zIndex,
    },
  };
}

/**
 * Checks whether an appointment matches the current focus.
 * @param event event input.
 * @param focusedAppointmentId Resource identifier.
 * @returns Whether the appointment is focused.
 */

function isFocusedAppointment(
  event: CalendarEvent,
  focusedAppointmentId: number | null,
): boolean {
  return (
    event.resource.kind === "appointment" &&
    event.resource.id === focusedAppointmentId
  );
}

/**
 * Builds background styles for availability events.
 * @param event Availability event to style.
 * @returns Background event style properties.
 */
function availabilityEventStyle(event: CalendarEvent) {
  const color =
    event.resource.kind === "block"
      ? AVAILABILITY_COLORS.block
      : AVAILABILITY_COLORS.recurring;
  return {
    style: {
      backgroundColor: color,
      border: "1px solid rgba(19, 65, 118, 0.14)",
      borderRadius: "8px",
      color: "transparent",
      opacity: 0.9,
      pointerEvents: "none" as const,
    },
  };
}

/**
 * Returns day header styling for past and selected dates.
 * @param date Calendar date to style.
 * @param todayKey Current date in YYYY-MM-DD format.
 * @param selectedDay Currently selected date.
 * @returns Calendar day header attributes.
 */
function calendarDayProps(
  date: Date,
  todayKey: string,
  selectedDay: Date | null,
): React.HTMLAttributes<HTMLDivElement> {
  if (dateKey(date) < todayKey) {
    return { className: "schedule-past-day-header" };
  }
  if (selectedDay && isSameDay(date, selectedDay)) {
    return { style: { backgroundColor: "#fbeaf0" } };
  }
  return {};
}

/**
 * Props required by the psychologist availability page.
 */
type Props = {
  /** Whether the psychologist has accepted the schedule terms. */
  readonly psyTermsAccepted: boolean | null;
};

/**
 * Renders the psychologist calendar and contextual availability editor.
 * @param props Schedule terms acceptance state.
 * @returns The weekly availability page.
 */
export default function WeeklyAvailabilityPage({ psyTermsAccepted }: Props) {
  const terms = useScheduleTerms(psyTermsAccepted);
  const schedule = useScheduleBlocks();
  const appointments = useMyAppointments();
  const [calendarDate, setCalendarDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(() =>
    startOfDay(new Date()),
  );
  const [calendarView, setCalendarView] = useState<View>("week");
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [focusedAppointmentId, setFocusedAppointmentId] = useState<number | null>(
    null,
  );
  const [formMode, setFormMode] = useState<FormMode>("none");
  const [formFocusRequest, setFormFocusRequest] = useState(0);
  const availabilityFormRef = useRef<HTMLFormElement>(null);
  const [blockForm, setBlockForm] = useState(EMPTY_BLOCK_FORM);
  const [recurringForm, setRecurringForm] = useState(EMPTY_RECURRING_FORM);
  const [sharedTimeRange, setSharedTimeRange] = useState({
    startTime: "",
    endTime: "",
  });
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)");
    /**
     * Synchronizes the calendar view with the current screen width.
     * @returns Nothing.
     */
    const updateCalendarLayout = () => {
      setIsSmallScreen(mediaQuery.matches);
      if (mediaQuery.matches) setCalendarView("day");
    };

    updateCalendarLayout();
    mediaQuery.addEventListener("change", updateCalendarLayout);
    return () => mediaQuery.removeEventListener("change", updateCalendarLayout);
  }, []);

  useEffect(() => {
    if (formMode === "none") return;

    const frameId = window.requestAnimationFrame(() => {
      availabilityFormRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "center",
      });
      availabilityFormRef.current
        ?.querySelector<HTMLInputElement>('input[type="time"]')
        ?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [formMode, formFocusRequest]);

  const visibleRange = useMemo(
    () => visibleCalendarRange(calendarDate, calendarView),
    [calendarDate, calendarView],
  );

  const calendarEvents = useMemo(
    () => [
      ...blocksToEvents(schedule.blocks),
      ...appointmentsToEvents(appointments.appointments),
      ...recurringBlocksToEvents(
        schedule.recurringBlocks,
        visibleRange.start,
        visibleRange.end,
      ),
    ],
    [
      schedule.blocks,
      schedule.recurringBlocks,
      appointments.appointments,
      visibleRange,
    ],
  );

  const selectedDayEvents = useMemo(
    () =>
      selectedDay
        ? calendarEvents.filter((event) => isSameDay(event.start, selectedDay))
        : [],
    [calendarEvents, selectedDay],
  );
  const availabilityEvents = selectedDayEvents.filter(
    (event) => event.resource.kind !== "appointment",
  );
  const appointmentEvents = calendarEvents.filter(
    (event) => event.resource.kind === "appointment",
  );
  const focusedAppointment = appointmentEvents.find(
    (event) => event.resource.id === focusedAppointmentId,
  );
  const todayKey = dateKey(now);
  const selectedDayKey = selectedDay ? dateKey(selectedDay) : "";
  const selectedDayIsPast = selectedDayKey < todayKey;

  if (terms.isLoading) {
    return <p className="text-sm text-text-subtle">Cargando…</p>;
  }

  if (terms.loadError) {
    return <InlineMessage tone="error">{terms.loadError}</InlineMessage>;
  }

  if (!terms.hasAccepted) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-2xl font-bold text-primary-dark">
          Términos de uso de la agenda
        </h1>
        <div className="mt-4 rounded-2xl border border-border bg-surface p-6 text-sm leading-relaxed text-text">
          {terms.policyContent ? (
            <PolicyMarkdown>{terms.policyContent}</PolicyMarkdown>
          ) : (
            "Cargando términos…"
          )}
        </div>
        {terms.acceptError && (
          <div className="mt-4">
            <InlineMessage tone="error">{terms.acceptError}</InlineMessage>
          </div>
        )}
        <div className="mt-6">
          <Button onClick={terms.accept} disabled={terms.isAccepting}>
            {terms.isAccepting ? "Guardando…" : "Acepto y continúo"}
          </Button>
        </div>
      </div>
    );
  }

  /**
   * Selects a day and clears appointment focus and editor state.
   * @param date Selected calendar date.
   * @returns Nothing.
   */
  function chooseDay(date: Date) {
    setSelectedDay(date);
    setFocusedAppointmentId(null);
    setFormMode("none");
  }

  /**
   * Synchronizes the time range across one-time and recurring forms.
   * @param startTime Selected start time.
   * @param endTime Selected end time.
   * @returns Nothing.
   */
  function updateTimeRange(startTime: string, endTime: string) {
    const nextRange = { startTime, endTime };
    setSharedTimeRange(nextRange);
    setBlockForm((form) => ({ ...form, ...nextRange }));
    setRecurringForm((form) => ({ ...form, ...nextRange }));
  }

  /**
   * Handles calendar selection and opens the one-time availability form.
   * @param slot Selected calendar interval.
   * @returns Nothing.
   */
  function handleSelectSlot(slot: SlotInfo) {
    const isTimedSelection =
      calendarView !== "month" && isSameDay(slot.start, slot.end);
    const isPastSelection =
      dateKey(slot.start) < todayKey || (isTimedSelection && slot.start < now);
    chooseDay(slot.start);
    if (isPastSelection) return;

    const selectedTimeRange = isTimedSelection
      ? {
          startTime: format(slot.start, "HH:mm"),
          endTime: format(slot.end, "HH:mm"),
        }
      : sharedTimeRange;
    updateTimeRange(
      selectedTimeRange.startTime,
      selectedTimeRange.endTime,
    );
    setBlockForm({
      date: dateKey(slot.start),
      ...selectedTimeRange,
    });
    setFormMode("block");
    setFormFocusRequest((request) => request + 1);
  }

  /**
   * Opens the one-time availability form for the selected date.
   * @returns Nothing.
   */
  function openBlockForm() {
    if (!selectedDay) return;
    setBlockForm({
      ...EMPTY_BLOCK_FORM,
      date: selectedDayKey,
      ...sharedTimeRange,
    });
    setFormMode("block");
    setFormFocusRequest((request) => request + 1);
  }

  /**
   * Opens the recurring availability form for the selected weekday.
   * @returns Nothing.
   */
  function openRecurringForm() {
    if (!selectedDay) return;
    setRecurringForm({
      ...EMPTY_RECURRING_FORM,
      dayOfWeek: getISODay(selectedDay),
      validFrom: selectedDayKey,
      ...sharedTimeRange,
    });
    setFormMode("recurring");
    setFormFocusRequest((request) => request + 1);
  }

  /**
   * Creates the configured one-time availability block.
   * @returns A promise that resolves after the create operation completes.
   */
  async function submitBlock() {
    const success = await schedule.addBlock(blockForm);
    if (success) {
      setBlockForm(EMPTY_BLOCK_FORM);
      setFormMode("none");
    }
  }

  /**
   * Creates the configured recurring availability rule.
   * @returns A promise that resolves after the create operation completes.
   */
  async function submitRecurringBlock() {
    const success = await schedule.addRecurringBlock(recurringForm);
    if (success) {
      setRecurringForm(EMPTY_RECURRING_FORM);
      setFormMode("none");
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <h1 className="font-display text-3xl font-bold text-primary-dark">
          Mi agenda
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-text-muted">
          Consulta tus citas y gestiona tu disponibilidad desde el calendario.
          Las fechas pasadas se muestran atenuadas.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface p-3 sm:p-5">
        {schedule.isLoading || appointments.isLoading ? (
          <p className="py-16 text-center text-sm text-text-subtle">
            Cargando calendario…
          </p>
        ) : (
          <div className="h-[520px] sm:h-[620px]">
            <CalendarWithBackgroundStyles
              localizer={localizer}
              startAccessor="start"
              endAccessor="end"
              view={calendarView}
              onView={setCalendarView}
              date={calendarDate}
              onNavigate={(date: Date) => {
                setCalendarDate(date);
                setSelectedDay(startOfDay(date));
                setFocusedAppointmentId(null);
                setFormMode("none");
              }}
              views={["week", "day", "month"]}
              longPressThreshold={140}
              components={{
                header: CalendarDayHeader,
                month: { dateHeader: CalendarMonthDateHeader },
              }}
              dayLayoutAlgorithm="overlap"
              backgroundEvents={calendarEvents.filter(
                (event) => event.resource.kind !== "appointment",
              )}
              backgroundEventPropGetter={availabilityEventStyle}
              selectable
              onSelectSlot={handleSelectSlot}
              events={
                calendarView === "month" ? calendarEvents : appointmentEvents
              }
              onSelectEvent={(event: CalendarEvent) => {
                chooseDay(event.start);
                if (event.resource.kind === "appointment") {
                  setFocusedAppointmentId(event.resource.id);
                }
              }}
              dayPropGetter={(date: Date) =>
                calendarDayProps(date, todayKey, selectedDay)
              }
              eventPropGetter={(event: CalendarEvent) =>
                eventStyle(event, now, focusedAppointmentId)
              }
              culture="es"
              messages={{
                week: "Semana",
                day: "Día",
                month: "Mes",
                today: "Hoy",
                previous: "Anterior",
                next: "Siguiente",
                noEventsInRange: "No hay eventos en este rango.",
                showMore: (total: number) => `+${total} más`,
              }}
            />
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-text-subtle">
          <span className="flex items-center gap-1.5">
            <span
              className="h-3 w-3 rounded-sm ring-1 ring-border"
              style={{ backgroundColor: AVAILABILITY_COLORS.block }}
            />{" "}
            Puntual
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-3 w-3 rounded-sm ring-1 ring-border"
              style={{ backgroundColor: AVAILABILITY_COLORS.recurring }}
            />{" "}
            Recurrente
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-[#134176]" />{" "}
            Cita
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-[#e2e4e8] ring-1 ring-border" />
            {" "}
            Día pasado
          </span>
        </div>
      </div>

      {focusedAppointment && (
        <AppointmentDetailsDialog
          event={focusedAppointment}
          onClose={() => setFocusedAppointmentId(null)}
        />
      )}

      {appointments.loadError && (
        <div className="mt-4">
          <InlineMessage tone="error">{appointments.loadError}</InlineMessage>
        </div>
      )}

      {selectedDay && (
        <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-display text-lg font-bold capitalize text-text">
              {formatLongDate(selectedDay)}
            </h2>
          </div>

          <div className="space-y-5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-subtle">
                  Gestión de disponibilidad
                </h3>
                <p className="mt-1 text-sm text-text-muted">
                  Agrega un horario puntual o una regla que se repita cada
                  semana. Las citas se muestran sobre la disponibilidad.
                </p>
                <p className="mt-1 text-xs text-text-subtle">
                  {isSmallScreen
                    ? "Mantén pulsada una hora y arrastra hasta el final para seleccionar la franja."
                    : "Arrastra sobre el calendario para seleccionar una franja; se abrirá el formulario con las horas elegidas."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={openBlockForm}
                  disabled={schedule.isSaving || selectedDayIsPast}
                >
                  <Clock3 size={15} aria-hidden />
                  Horario puntual
                </Button>
                <Button
                  variant="secondary"
                  onClick={openRecurringForm}
                  disabled={schedule.isSaving || selectedDayIsPast}
                >
                  <Repeat size={15} aria-hidden />
                  Regla semanal
                </Button>
              </div>
            </div>

            {selectedDayIsPast && (
              <p className="rounded-xl bg-surface-muted px-4 py-3 text-sm text-text-muted">
                Esta fecha ya pasó. Puedes consultar sus eventos, pero no
                agregar disponibilidad.
              </p>
            )}

            {availabilityEvents.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-5 text-center text-sm text-text-muted">
                No hay disponibilidad puntual o recurrente para este día.
              </p>
            ) : (
              <ul className="space-y-2">
                {availabilityEvents.map((event) => {
                    const isRecurring =
                      event.resource.kind === "recurring";
                    const recurringRule = isRecurring
                      ? schedule.recurringBlocks.find(
                          (rule) => rule.id === event.resource.id,
                        )
                      : undefined;
                    const canRemove =
                      event.resource.kind === "block" ||
                      (isRecurring && recurringRule && !recurringRule.hasAppointments);

                  return (
                    <li
                      key={`${event.resource.kind}-${event.resource.id}-${dateKey(event.start)}-${format(event.start, "HH:mm")}`}
                        className="flex items-center gap-3 rounded-xl border border-border px-4 py-3"
                      >
                        {isRecurring ? (
                          <Repeat
                            size={16}
                            className="shrink-0 text-[#32929b]"
                            aria-hidden
                          />
                        ) : (
                          <Clock3
                            size={16}
                            className="shrink-0 text-[#d94876]"
                            aria-hidden
                          />
                        )}
                        <div>
                          <p className="text-sm font-semibold text-text">
                            {format(event.start, "HH:mm")} –{" "}
                            {format(event.end, "HH:mm")}
                          </p>
                          <p className="text-xs text-text-muted">
                            {isRecurring
                              ? "Disponibilidad recurrente"
                              : "Disponibilidad puntual"}
                          </p>
                        </div>
                        {canRemove ? (
                          <button
                            type="button"
                            onClick={() =>
                              isRecurring
                                ? schedule.removeRecurringBlock(event.resource.id)
                                : schedule.removeBlock(event.resource.id)
                            }
                            disabled={schedule.isSaving}
                            aria-label={
                              isRecurring
                                ? "Eliminar regla recurrente"
                                : "Eliminar disponibilidad puntual"
                            }
                            className="ml-auto rounded-lg p-2 text-text-subtle transition hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 size={16} aria-hidden />
                          </button>
                        ) : (
                          <LockKeyhole
                            size={15}
                            className="ml-auto text-text-subtle"
                            aria-label="La regla tiene consultas asignadas"
                          />
                        )}
                    </li>
                  );
                })}
              </ul>
            )}

              {formMode === "block" && (
                <form
                  ref={availabilityFormRef}
                  onSubmit={(event) => {
                    event.preventDefault();
                    void submitBlock();
                  }}
                  className="space-y-4 rounded-xl border border-primary/20 bg-primary-soft/20 p-4"
                >
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="sm:col-span-1">
                      <span className="text-xs font-semibold text-text-muted">
                        Fecha
                      </span>
                      <p className="mt-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm capitalize text-text">
                        {formatStoredDate(blockForm.date)}
                      </p>
                    </div>
                    <label className="block">
                      <span className="text-xs font-semibold text-text-muted">
                        Desde
                      </span>
                      <input
                        type="time"
                        required
                        min={selectedDayKey === todayKey ? format(now, "HH:mm") : undefined}
                        value={blockForm.startTime}
                        onChange={(event) =>
                          updateTimeRange(
                            event.target.value,
                            sharedTimeRange.endTime,
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-text-muted">
                        Hasta
                      </span>
                      <input
                        type="time"
                        required
                        value={blockForm.endTime}
                        onChange={(event) =>
                          updateTimeRange(
                            sharedTimeRange.startTime,
                            event.target.value,
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text"
                      />
                    </label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setFormMode("none")}
                      disabled={schedule.isSaving}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        schedule.isSaving ||
                        !blockForm.startTime ||
                        !blockForm.endTime ||
                        (blockForm.date === todayKey &&
                          blockForm.startTime <= format(now, "HH:mm")) ||
                        blockForm.startTime >= blockForm.endTime
                      }
                    >
                      {schedule.isSaving ? "Guardando…" : "Guardar horario"}
                    </Button>
                  </div>
                </form>
              )}

              {formMode === "recurring" && (
                <form
                  ref={availabilityFormRef}
                  onSubmit={(event) => {
                    event.preventDefault();
                    void submitRecurringBlock();
                  }}
                  className="space-y-4 rounded-xl border border-primary/20 bg-primary-soft/20 p-4"
                >
                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="block">
                      <span className="text-xs font-semibold text-text-muted">
                        Día de la semana
                      </span>
                      <select
                        value={recurringForm.dayOfWeek}
                        onChange={(event) =>
                          setRecurringForm((form) => ({
                            ...form,
                            dayOfWeek: Number(event.target.value),
                          }))
                        }
                        className="mt-2 w-full cursor-pointer rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text"
                      >
                        {Object.entries(DAY_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-text-muted">
                        Desde
                      </span>
                      <input
                        type="time"
                        required
                        value={recurringForm.startTime}
                        onChange={(event) =>
                          updateTimeRange(
                            event.target.value,
                            sharedTimeRange.endTime,
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-text-muted">
                        Hasta
                      </span>
                      <input
                        type="time"
                        required
                        value={recurringForm.endTime}
                        onChange={(event) =>
                          updateTimeRange(
                            sharedTimeRange.startTime,
                            event.target.value,
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text"
                      />
                    </label>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-xs font-semibold text-text-muted">
                        Válido desde
                      </span>
                      <input
                        type="date"
                        required
                        min={todayKey}
                        value={recurringForm.validFrom}
                        onChange={(event) =>
                          setRecurringForm((form) => ({
                            ...form,
                            validFrom: event.target.value,
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-semibold text-text-muted">
                        Válido hasta (opcional)
                      </span>
                      <input
                        type="date"
                        min={recurringForm.validFrom || todayKey}
                        value={recurringForm.validUntil ?? ""}
                        onChange={(event) =>
                          setRecurringForm((form) => ({
                            ...form,
                            validUntil: event.target.value || undefined,
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text"
                      />
                    </label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setFormMode("none")}
                      disabled={schedule.isSaving}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        schedule.isSaving ||
                        !recurringForm.startTime ||
                        !recurringForm.endTime ||
                        !recurringForm.validFrom ||
                        recurringForm.startTime >= recurringForm.endTime ||
                        Boolean(
                          recurringForm.validUntil &&
                            recurringForm.validUntil < recurringForm.validFrom,
                        )
                      }
                    >
                      {schedule.isSaving ? "Guardando…" : "Guardar regla"}
                    </Button>
                  </div>
                </form>
              )}
          </div>
        </section>
      )}

      {schedule.error && (
        <div className="mt-6">
          <InlineMessage tone="error">{schedule.error}</InlineMessage>
        </div>
      )}
    </div>
  );
}

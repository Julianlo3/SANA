"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  type SlotInfo,
} from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../styles/calendar-overrides.css";
import InlineMessage from "@/components/feedback/inline-message";
import { listPsychologistOptions } from "@/features/appointments/services/appointments-service";
import type { PsychologistOption } from "@/features/appointments/types/appointment-types";
import DayDetail from "../components/day-detail";
import { usePsychologistCalendar } from "../hooks/use-psychologist-calendar";
import {
  dateKey,
  summarizeDays,
  summariesToEvents,
} from "../lib/psychologist-calendar";
import type { CalendarEvent } from "../types/calendar-types";
import type { DaySummary } from "../types/psychologist-calendar-types";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales: { es },
});

function eventStyle(event: CalendarEvent) {
  const isAppointment = event.resource.kind === "appointment";
  return {
    style: {
      backgroundColor: isAppointment ? "#134176" : "#eb5886",
      borderRadius: "10px",
      border: "none",
      color: "white",
      fontSize: "0.7rem",
      padding: "1px 6px",
    },
  };
}

/**
 * Calendario de un psicólogo para la asistente. Solo vista mensual: cada día
 * muestra si tiene espacio o citas, y al tocarlo se abre el detalle del día.
 */
export default function PsychologistCalendarPage() {
  const [psychologists, setPsychologists] = useState<PsychologistOption[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const calendar = usePsychologistCalendar(selectedId);

  const days = useMemo(
    () =>
      calendar.calendar
        ? summarizeDays(calendar.calendar)
        : new Map<string, DaySummary>(),
    [calendar.calendar],
  );
  const events = useMemo(() => summariesToEvents(days), [days]);
  const selectedKey = selectedDay ? dateKey(selectedDay) : null;

  useEffect(() => {
    const controller = new AbortController();

    listPsychologistOptions(controller.signal)
      .then((result) => setPsychologists(result))
      .catch(() => {
        if (controller.signal.aborted) return;
        setListError("No pudimos cargar los psicólogos. Intenta de nuevo.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingList(false);
      });

    return () => controller.abort();
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl font-bold text-primary-dark">
        Calendario de psicólogos
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        Elige un psicólogo y toca un día para ver si tiene espacio o citas.
      </p>

      <label className="mt-6 block max-w-sm">
        <span className="text-sm font-medium text-text">Psicólogo</span>
        <select
          value={selectedId ?? ""}
          disabled={isLoadingList}
          onChange={(event) => {
            setSelectedId(event.target.value ? Number(event.target.value) : null);
            setSelectedDay(null);
          }}
          className="mt-2 w-full cursor-pointer rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed"
        >
          <option value="">
            {isLoadingList ? "Cargando…" : "Selecciona un psicólogo"}
          </option>
          {psychologists.map((psychologist) => (
            <option key={psychologist.psyId} value={psychologist.psyId}>
              {psychologist.name}
              {psychologist.speciality ? ` · ${psychologist.speciality}` : ""}
            </option>
          ))}
        </select>
      </label>

      {listError && (
        <div className="mt-4">
          <InlineMessage tone="error">{listError}</InlineMessage>
        </div>
      )}

      {selectedId === null && !listError && (
        <p className="mt-8 rounded-2xl border border-border bg-surface px-5 py-10 text-center text-sm text-text-subtle">
          Selecciona un psicólogo para ver su calendario.
        </p>
      )}

      {selectedId !== null && (
        <>
          <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
            {calendar.isLoading ? (
              <p className="py-10 text-center text-sm text-text-subtle">
                Cargando calendario…
              </p>
            ) : (
              <div className="h-[460px]">
                <BigCalendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  defaultView="month"
                  views={["month"]}
                  date={calendarDate}
                  onNavigate={setCalendarDate}
                  selectable
                  onSelectSlot={(slot: SlotInfo) => setSelectedDay(slot.start)}
                  onSelectEvent={(event: CalendarEvent) =>
                    setSelectedDay(event.start)
                  }
                  onDrillDown={(date: Date) => setSelectedDay(date)}
                  dayPropGetter={(date: Date) =>
                    selectedKey === dateKey(date)
                      ? { style: { backgroundColor: "#fbeaf0" } }
                      : {}
                  }
                  eventPropGetter={eventStyle}
                  culture="es"
                  messages={{
                    today: "Hoy",
                    previous: "Anterior",
                    next: "Siguiente",
                    month: "Mes",
                    noEventsInRange: "No hay nada en este rango.",
                    showMore: (total: number) => `+${total} más`,
                  }}
                />
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-text-subtle">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#eb5886]" /> Con espacio
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#134176]" /> Con citas
              </span>
            </div>
          </div>

          {selectedDay ? (
            <DayDetail date={selectedDay} summary={days.get(dateKey(selectedDay))} />
          ) : (
            !calendar.isLoading && (
              <p className="mt-6 rounded-2xl border border-border bg-surface px-5 py-8 text-center text-sm text-text-subtle">
                Toca un día del calendario para ver su detalle.
              </p>
            )
          )}
        </>
      )}

      {calendar.error && (
        <div className="mt-6">
          <InlineMessage tone="error">{calendar.error}</InlineMessage>
        </div>
      )}
    </div>
  );
}
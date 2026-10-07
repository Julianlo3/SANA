"use client";

import { useEffect, useState } from "react";
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  type View,
} from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../styles/calendar-overrides.css";
import InlineMessage from "@/components/feedback/inline-message";
import { listPsychologistOptions } from "@/features/appointments/services/appointments-service";
import type { PsychologistOption } from "@/features/appointments/types/appointment-types";
import { usePsychologistCalendar } from "../hooks/use-psychologist-calendar";
import type { CalendarEvent } from "../types/calendar-types";

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
      fontSize: "0.75rem",
      padding: "2px 6px",
    },
  };
}

/**
 * Calendario de un psicólogo para la asistente: sus bloques de disponibilidad
 * y las citas que ya los ocupan, para ver de un vistazo si tiene espacio.
 */
export default function PsychologistCalendarPage() {
  const [psychologists, setPsychologists] = useState<PsychologistOption[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [calendarView, setCalendarView] = useState<View>("week");
  const [calendarDate, setCalendarDate] = useState(new Date());

  const calendar = usePsychologistCalendar(selectedId);

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
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-bold text-primary-dark">
        Calendario de psicólogos
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        Elige un psicólogo para ver en qué horarios tiene disponibilidad y
        cuáles ya tienen una cita.
      </p>

      <label className="mt-6 block max-w-sm">
        <span className="text-sm font-medium text-text">Psicólogo</span>
        <select
          value={selectedId ?? ""}
          disabled={isLoadingList}
          onChange={(event) =>
            setSelectedId(event.target.value ? Number(event.target.value) : null)
          }
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
        <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
          {calendar.isLoading ? (
            <p className="py-10 text-center text-sm text-text-subtle">
              Cargando calendario…
            </p>
          ) : (
            <div className="h-[520px]">
              <BigCalendar
                localizer={localizer}
                events={calendar.events}
                startAccessor="start"
                endAccessor="end"
                view={calendarView}
                onView={setCalendarView}
                date={calendarDate}
                onNavigate={setCalendarDate}
                views={["week", "day", "month"]}
                eventPropGetter={eventStyle}
                culture="es"
                messages={{
                  week: "Semana",
                  day: "Día",
                  month: "Mes",
                  today: "Hoy",
                  previous: "Anterior",
                  next: "Siguiente",
                  noEventsInRange: "No hay nada en este rango.",
                }}
              />
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-text-subtle">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#eb5886]" /> Disponible
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#134176]" /> Con cita
            </span>
          </div>
        </div>
      )}

      {calendar.error && (
        <div className="mt-6">
          <InlineMessage tone="error">{calendar.error}</InlineMessage>
        </div>
      )}
    </div>
  );
}
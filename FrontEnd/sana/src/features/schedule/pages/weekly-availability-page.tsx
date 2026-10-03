"use client";

import { useMemo, useState } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../styles/calendar-overrides.css";
import { CalendarDays, Clock, LayoutList, Lock, Repeat, Trash2 } from "lucide-react";import InlineMessage from "@/components/feedback/inline-message";
import Button from "@/components/ui/button";
import { useScheduleBlocks } from "../hooks/use-schedule-blocks";
import { useScheduleTerms } from "../hooks/use-schedule-terms";
import {
  blocksToEvents,
  recurringBlocksToEvents,
} from "../lib/schedule-calendar";
import type {
  CreateRecurringScheduleBlockPayload,
  CreateScheduleBlockPayload,
  RecurringScheduleBlock,
  ScheduleBlock,
} from "../types/schedule-types";
import type { CalendarEvent } from "../types/calendar-types";

const DAY_LABELS: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

const locales = { es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

function formatTime(time: string): string {
  return time.slice(0, 5);
}

function formatDate(date: string): string {
  const [year, month, day] = date.slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

const EMPTY_BLOCK_FORM: CreateScheduleBlockPayload = {
  date: "",
  startTime: "",
  endTime: "",
  reason: "",
};

const EMPTY_RECURRING_FORM: CreateRecurringScheduleBlockPayload = {
  dayOfWeek: 1,
  startTime: "",
  endTime: "",
  validFrom: "",
  reason: "",
};

function renderBlocksList(isLoading: boolean, blocks: ScheduleBlock[]) {
  if (isLoading) {
    return <p className="text-sm text-text-subtle">Cargando…</p>;
  }
  if (blocks.length === 0) {
    return (
      <p className="text-sm text-text-subtle">
        No tienes bloques de disponibilidad puntuales.
      </p>
    );
  }
  return null;
}

function renderRecurringList(isLoading: boolean, rules: RecurringScheduleBlock[]) {
  if (isLoading) {
    return <p className="text-sm text-text-subtle">Cargando…</p>;
  }
  if (rules.length === 0) {
    return <p className="text-sm text-text-subtle">No tienes reglas recurrentes.</p>;
  }
  return null;
}

function eventStyle(event: CalendarEvent) {
  const colors: Record<CalendarEvent["resource"]["kind"], string> = {
    block: "#eb5886",
    recurring: "#43acb6",
    appointment: "#134176",
  };
  return {
    style: {
      backgroundColor: colors[event.resource.kind],
      borderRadius: "10px",
      border: "none",
      color: "white",
      fontSize: "0.75rem",
      padding: "2px 6px",
    },
  };
}

type Props = {
  psyTermsAccepted: boolean | null;
};

/**
 * Agenda del psicólogo (modelo de bloques de disponibilidad): por defecto
 * no hay ninguna cita disponible. El psicólogo declara los bloques, puntuales
 * o recurrentes, en los que sí puede atender. La asistente solo puede asignar
 * citas dentro de esos bloques.
 */
export default function WeeklyAvailabilityPage({ psyTermsAccepted }: Props) {
  const terms = useScheduleTerms(psyTermsAccepted);
  const schedule = useScheduleBlocks();

  const [view, setView] = useState<"list" | "calendar">("calendar");
  const [calendarView, setCalendarView] = useState<View>("week");
  const [calendarDate, setCalendarDate] = useState(new Date());

  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockForm, setBlockForm] = useState(EMPTY_BLOCK_FORM);

  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [recurringForm, setRecurringForm] = useState(EMPTY_RECURRING_FORM);

  const calendarEvents = useMemo(() => {
    const rangeStart = new Date(calendarDate);
    rangeStart.setDate(rangeStart.getDate() - 7);
    const rangeEnd = new Date(calendarDate);
    rangeEnd.setDate(rangeEnd.getDate() + 35);

    return [
      ...blocksToEvents(schedule.blocks),
      ...recurringBlocksToEvents(schedule.recurringBlocks, rangeStart, rangeEnd),
    ];
  }, [schedule.blocks, schedule.recurringBlocks, calendarDate]);

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
          {terms.policyContent ?? "Cargando términos…"}
        </div>
        <div className="mt-6">
          <Button onClick={terms.accept} disabled={terms.isAccepting}>
            {terms.isAccepting ? "Guardando…" : "Acepto y continúo"}
          </Button>
        </div>
      </div>
    );
  }

  async function submitBlock() {
    const success = await schedule.addBlock(blockForm);
    if (success) {
      setBlockForm(EMPTY_BLOCK_FORM);
      setShowBlockForm(false);
    }
  }

  async function submitRecurringBlock() {
    const success = await schedule.addRecurringBlock(recurringForm);
    if (success) {
      setRecurringForm(EMPTY_RECURRING_FORM);
      setShowRecurringForm(false);
    }
  }

  const blocksEmptyState = renderBlocksList(schedule.isLoading, schedule.blocks);
  const recurringEmptyState = renderRecurringList(
    schedule.isLoading,
    schedule.recurringBlocks,
  );

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary-dark">
            Mi agenda
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Por defecto no tienes citas disponibles. Marca aquí los bloques de
            tiempo en los que sí puedes atender, puntuales o de forma
            recurrente — la asistente solo podrá asignar citas dentro de esos
            bloques.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView("calendar")}
            aria-pressed={view === "calendar"}
            className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
              view === "calendar"
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-text-muted hover:border-primary hover:text-primary"
            }`}
          >
            <CalendarDays size={14} aria-hidden /> Calendario
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
            className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
              view === "list"
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-text-muted hover:border-primary hover:text-primary"
            }`}
          >
            <LayoutList size={14} aria-hidden /> Lista
          </button>
        </div>
      </div>

      {view === "calendar" && (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-4">
          <div className="h-[450px]">
            <BigCalendar
              localizer={localizer}
              events={calendarEvents}
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

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-text-subtle">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#eb5886]" /> Bloque puntual
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#43acb6]" /> Recurrente
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#134176]" /> Cita asignada
            </span>
          </div>
        </div>
      )}

      {view === "list" && (
        <>
          <section className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-text">
                <Clock size={18} /> Bloques de disponibilidad puntuales
              </h2>
              <Button
                variant="secondary"
                onClick={() => setShowBlockForm((value) => !value)}
              >
                {showBlockForm ? "Cancelar" : "Agregar bloque"}
              </Button>
            </div>

            {showBlockForm && (
              <div className="mt-4 space-y-4 rounded-2xl border border-border bg-surface p-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="block">
                    <span className="text-sm font-medium text-text">Fecha</span>
                    <input
                      type="date"
                      value={blockForm.date}
                      onChange={(event) =>
                        setBlockForm((form) => ({ ...form, date: event.target.value }))
                      }
                      className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-text">Desde</span>
                    <input
                      type="time"
                      value={blockForm.startTime}
                      onChange={(event) =>
                        setBlockForm((form) => ({
                          ...form,
                          startTime: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-text">Hasta</span>
                    <input
                      type="time"
                      value={blockForm.endTime}
                      onChange={(event) =>
                        setBlockForm((form) => ({ ...form, endTime: event.target.value }))
                      }
                      className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-medium text-text">Motivo</span>
                  <input
                    type="text"
                    value={blockForm.reason}
                    maxLength={255}
                    placeholder="Ej. Horario de consulta"
                    onChange={(event) =>
                      setBlockForm((form) => ({ ...form, reason: event.target.value }))
                    }
                    className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text"
                  />
                </label>

                <Button
                  onClick={submitBlock}
                  disabled={
                    schedule.isSaving ||
                    !blockForm.date ||
                    !blockForm.startTime ||
                    !blockForm.endTime ||
                    !blockForm.reason.trim()
                  }
                >
                  {schedule.isSaving ? "Guardando…" : "Guardar bloque"}
                </Button>
              </div>
            )}

            <div className="mt-4 space-y-2">
              {blocksEmptyState ??
                schedule.blocks.map((block) => (
                  <div
                    key={block.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-surface p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-text">
                        {formatDate(block.date)} · {formatTime(block.startTime)} –{" "}
                        {formatTime(block.endTime)}
                      </p>
                      <p className="text-xs text-text-subtle">
                        {block.appointmentId !== null
                          ? "Cita asignada"
                          : block.reason}
                      </p>
                    </div>

                    {block.appointmentId === null ? (
                      <button
                        type="button"
                        onClick={() => schedule.removeBlock(block.id)}
                        disabled={schedule.isSaving}
                        aria-label="Borrar bloque"
                        className="cursor-pointer text-text-subtle hover:text-danger disabled:cursor-not-allowed"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <Lock size={16} className="text-text-subtle" aria-hidden />
                    )}
                  </div>
                ))}
            </div>
          </section>

          <section className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-text">
                <Repeat size={18} /> Disponibilidad recurrente
              </h2>
              <Button
                variant="secondary"
                onClick={() => setShowRecurringForm((value) => !value)}
              >
                {showRecurringForm ? "Cancelar" : "Agregar regla"}
              </Button>
            </div>

            {showRecurringForm && (
              <div className="mt-4 space-y-4 rounded-2xl border border-border bg-surface p-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="block">
                    <span className="text-sm font-medium text-text">Día</span>
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
                    <span className="text-sm font-medium text-text">Desde</span>
                    <input
                      type="time"
                      value={recurringForm.startTime}
                      onChange={(event) =>
                        setRecurringForm((form) => ({
                          ...form,
                          startTime: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-text">Hasta</span>
                    <input
                      type="time"
                      value={recurringForm.endTime}
                      onChange={(event) =>
                        setRecurringForm((form) => ({
                          ...form,
                          endTime: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-text">
                      Válido desde
                    </span>
                    <input
                      type="date"
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
                    <span className="text-sm font-medium text-text">
                      Válido hasta (opcional)
                    </span>
                    <input
                      type="date"
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

                <label className="block">
                  <span className="text-sm font-medium text-text">Motivo</span>
                  <input
                    type="text"
                    value={recurringForm.reason}
                    maxLength={255}
                    placeholder="Ej. Horario fijo de consulta"
                    onChange={(event) =>
                      setRecurringForm((form) => ({
                        ...form,
                        reason: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text"
                  />
                </label>

                <Button
                  onClick={submitRecurringBlock}
                  disabled={
                    schedule.isSaving ||
                    !recurringForm.startTime ||
                    !recurringForm.endTime ||
                    !recurringForm.validFrom ||
                    !recurringForm.reason.trim()
                  }
                >
                  {schedule.isSaving ? "Guardando…" : "Guardar regla"}
                </Button>
              </div>
            )}

            <div className="mt-4 space-y-2">
              {recurringEmptyState ??
                schedule.recurringBlocks.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-surface p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-text">
                        {DAY_LABELS[rule.dayOfWeek]} · {formatTime(rule.startTime)} –{" "}
                        {formatTime(rule.endTime)}
                      </p>
                      <p className="text-xs text-text-subtle">
                        {rule.reason} · desde {formatDate(rule.validFrom)}
                        {rule.validUntil ? ` hasta ${formatDate(rule.validUntil)}` : ""}
                        {!rule.active && " · inactiva"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => schedule.removeRecurringBlock(rule.id)}
                      disabled={schedule.isSaving}
                      aria-label="Borrar regla"
                      className="cursor-pointer text-text-subtle hover:text-danger disabled:cursor-not-allowed"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
            </div>
          </section>
        </>
      )}

      {schedule.error && (
        <div className="mt-6">
          <InlineMessage tone="error">{schedule.error}</InlineMessage>
        </div>
      )}
    </div>
  );
}
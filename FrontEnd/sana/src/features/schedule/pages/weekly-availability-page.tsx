"use client";

import { useState } from "react";
import { Clock, Lock, Repeat, Trash2 } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import Button from "@/components/ui/button";
import { useScheduleBlocks } from "../hooks/use-schedule-blocks";
import { useScheduleTerms } from "../hooks/use-schedule-terms";
import type {
  CreateRecurringScheduleBlockPayload,
  CreateScheduleBlockPayload,
  RecurringScheduleBlock,
  ScheduleBlock,
} from "../types/schedule-types";

const DAY_LABELS: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

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
    return <p className="text-sm text-text-subtle">No tienes bloqueos puntuales.</p>;
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

/**
 * Agenda del psicólogo (modelo de bloqueos): todo cuenta como disponible
 * para que la asistente asigne citas, salvo las horas que aquí se bloqueen,
 * puntuales o recurrentes.
 */
export default function WeeklyAvailabilityPage() {
  const terms = useScheduleTerms();
  const schedule = useScheduleBlocks();

  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockForm, setBlockForm] = useState(EMPTY_BLOCK_FORM);

  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [recurringForm, setRecurringForm] = useState(EMPTY_RECURRING_FORM);

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
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-primary-dark">
        Mi agenda
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        Por defecto estás disponible. Bloquea aquí las horas en las que no
        puedes atender, puntuales o de forma recurrente.
      </p>

      {schedule.error && (
        <div className="mt-4">
          <InlineMessage tone="error">{schedule.error}</InlineMessage>
        </div>
      )}

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-text">
            <Clock size={18} /> Bloqueos puntuales
          </h2>
          <Button
            variant="secondary"
            onClick={() => setShowBlockForm((value) => !value)}
          >
            {showBlockForm ? "Cancelar" : "Agregar bloqueo"}
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
                placeholder="Ej. Cita médica"
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
              {schedule.isSaving ? "Guardando…" : "Guardar bloqueo"}
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
                    aria-label="Borrar bloqueo"
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
            <Repeat size={18} /> Reglas recurrentes
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
                placeholder="Ej. Clase en la universidad"
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
    </div>
  );
}
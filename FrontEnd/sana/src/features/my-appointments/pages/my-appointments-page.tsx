"use client";

import InlineMessage from "@/components/feedback/inline-message";
import MyAppointmentCard from "../components/my-appointment-card";
import { useMyAppointments } from "../hooks/use-my-appointments";
import type { MyAppointmentState } from "../types/my-appointments-types";

const FILTERS: { value: MyAppointmentState; label: string }[] = [
  { value: "confirmada", label: "Próximas" },
  { value: "realizada", label: "Realizadas" },
  { value: "cancelada", label: "Canceladas" },
];

const EMPTY_TEXT: Record<MyAppointmentState, string> = {
  confirmada: "No tienes citas confirmadas por atender.",
  realizada: "Todavía no has realizado citas.",
  cancelada: "No tienes citas canceladas.",
};

/** Las citas del psicólogo, en tarjetas, con acceso directo al registro de atención. */
export default function MyAppointmentsPage() {
  const { filter, changeFilter, appointments, isLoading, loadError } =
    useMyAppointments();

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-3xl font-bold text-primary-dark">
        Mis citas
      </h1>
      <p className="mt-2 text-sm text-text-muted">
        Revisa las citas que tienes asignadas y registra la atención cuando las
        realices.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => changeFilter(option.value)}
            aria-pressed={filter === option.value}
            className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
              filter === option.value
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-text-muted hover:border-primary hover:text-primary"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loadError && (
        <div className="mt-6">
          <InlineMessage tone="error">{loadError}</InlineMessage>
        </div>
      )}

      {isLoading && (
        <p className="mt-8 text-sm text-text-subtle">Cargando tus citas…</p>
      )}

      {!isLoading && !loadError && (
        <>
          {appointments.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-border bg-surface px-5 py-10 text-center text-sm text-text-subtle">
              {EMPTY_TEXT[filter]}
            </p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {appointments.map((appointment) => (
                <MyAppointmentCard
                  key={appointment.appId}
                  appointment={appointment}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
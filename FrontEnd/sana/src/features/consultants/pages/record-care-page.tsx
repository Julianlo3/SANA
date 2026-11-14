"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import Button from "@/components/ui/button";
import { formatDateTime } from "@/features/appointments/lib/appointment-format";
import { useRecordCare } from "../hooks/use-record-care";

/**
 * Parses and validates an appointment identifier from the route.
 * @param value Appointment identifier from the route query.
 * @returns The positive appointment identifier, or null when invalid.
 */
function parseAppointmentId(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Lets psychologists complete a confirmed appointment and optionally record
 * a care note. The backend requires completion before note registration.
 * @returns The appointment completion and care-record form.
 */
export default function RecordCarePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const care = useRecordCare(parseAppointmentId(searchParams.get("cita")));

  if (care.wasSaved) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
          <CheckCircle2 size={32} aria-hidden />
        </span>

        <h1 className="mt-6 font-display text-2xl font-bold text-text">
          Atención registrada
        </h1>

        <p className="mt-2 text-sm text-text-muted">
          La cita quedó marcada como realizada y el registro quedó guardado en
          el historial del consultante.
        </p>

        <div className="mt-8">
          <Button onClick={() => router.push("/consultantes")}>
            Volver al listado
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/consultantes"
        className="inline-flex items-center gap-2 text-sm text-text-muted transition hover:text-primary"
      >
        <ArrowLeft size={16} aria-hidden />
        Volver
      </Link>

      <h1 className="mt-6 font-display text-2xl font-bold text-text">
        Registrar atención
      </h1>

      <p className="mt-2 text-sm text-text-muted">
        Elige la cita que atendiste. Al guardar, queda marcada como realizada
        y, si quieres, con una observación general.
      </p>

      {care.isLoading && (
        <p className="mt-8 text-sm text-text-subtle">Cargando tus citas…</p>
      )}

      {care.loadError && (
        <div className="mt-8">
          <InlineMessage tone="error">{care.loadError}</InlineMessage>
        </div>
      )}

      {!care.isLoading && !care.loadError && (
        <div className="mt-8 space-y-6 rounded-2xl border border-border bg-surface p-6">
          {care.appointments.length === 0 ? (
            <p className="text-sm text-text-subtle">
              No tienes citas confirmadas pendientes de atender.
            </p>
          ) : (
            <label className="block">
              <span className="text-sm font-semibold text-text">Cita</span>

              <select
                value={care.selectedAppointment?.appId ?? ""}
                disabled={care.isSaving}
                onChange={(event) =>
                  care.selectAppointment(
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
                className="mt-2 w-full cursor-pointer rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed"
              >
                <option value="">Selecciona una cita</option>

                {care.appointments.map((appointment) => (
                  <option key={appointment.appId} value={appointment.appId}>
                    {appointment.patientName} —{" "}
                    {appointment.appDate
                      ? formatDateTime(appointment.appDate)
                      : "Sin fecha"}
                  </option>
                ))}
              </select>
            </label>
          )}

          {care.selectedAppointment && (
            <>
              {care.isAssessment && (
                <section className="space-y-4 rounded-xl border border-primary/20 bg-primary-soft/20 p-4">
                  <div>
                    <h2 className="text-sm font-bold text-primary-dark">
                      Sugerencia de paquete
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-text-muted">
                      La secretaría revisará la prioridad y definirá el número
                      final de citas del paquete.
                    </p>
                  </div>

                  <label className="block">
                    <span className="text-sm font-medium text-text">
                      Prioridad
                    </span>
                    <select
                      value={care.packagePriority}
                      disabled={care.isSaving}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (
                          value === "alta" ||
                          value === "media" ||
                          value === "baja" ||
                          value === ""
                        ) {
                          care.setPackagePriority(value);
                        }
                      }}
                      className="mt-2 w-full cursor-pointer rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed"
                    >
                      <option value="">Selecciona la prioridad</option>
                      <option value="alta">Alta</option>
                      <option value="media">Media</option>
                      <option value="baja">Baja</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-text">
                      Número de citas sugeridas (opcional)
                    </span>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={care.suggestedSessionLimit}
                      disabled={care.isSaving}
                      onChange={(event) =>
                        care.setSuggestedSessionLimit(event.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed"
                    />
                  </label>
                </section>
              )}

              <label className="block">
                <span className="text-sm font-medium text-text">
                  Observación general (opcional)
                </span>

                <textarea
                  value={care.observation}
                  disabled={care.isSaving}
                  onChange={(event) =>
                    care.changeObservation(event.target.value)
                  }
                  rows={4}
                  maxLength={1000}
                  placeholder="Ej. Sesión de seguimiento, sin novedades."
                  className="mt-2 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed"
                />

                {care.observationError && (
                  <span role="alert" className="mt-1.5 block text-xs text-danger">
                    {care.observationError}
                  </span>
                )}
              </label>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={care.termsAccepted}
                  disabled={care.isSaving}
                  onChange={(event) =>
                    care.setTermsAccepted(event.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary"
                />
                <span className="text-sm text-text">
                  Acepto los términos y condiciones para registrar notas
                  clínicas.
                </span>
              </label>
            </>
          )}

          {care.submitError && (
            <InlineMessage tone="error">{care.submitError}</InlineMessage>
          )}

          <Button
            onClick={care.save}
            disabled={!care.selectedAppointment || care.isSaving}
          >
            {care.isSaving ? "Guardando…" : "Guardar registro"}
          </Button>
        </div>
      )}
    </div>
  );
}
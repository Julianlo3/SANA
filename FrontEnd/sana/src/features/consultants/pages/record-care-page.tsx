"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import Button from "@/components/ui/button";
import { formatDateTime } from "@/features/appointments/lib/appointment-format";
import { useRecordCare } from "../hooks/use-record-care";

function parseAppointmentId(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

/**
 * HU-2.5: el psicólogo atiende una cita confirmada, la marca como realizada
 * y deja una observación general, opcional. El backend solo acepta la
 * observación sobre citas ya realizadas (HU-2.5.7), por eso son dos pasos.
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
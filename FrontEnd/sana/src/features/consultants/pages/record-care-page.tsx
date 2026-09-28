"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import Button from "@/components/ui/button";
import { formatRelativeDate } from "@/lib/format/date-time";
import {
  listPsychologistAppointments,
  recordCare,
} from "../services/care-record-service";
import { validateObservation } from "../validation/care-record-validation";
import type { PsychologistAppointment } from "../types/care-record-types";

/**
 * HU-2.5:
 * El psicólogo marca una cita como realizada y registra
 * una observación general, opcional.
 *
 * HU-2.5.7:
 * Solo se puede registrar atención sobre citas en estado
 * "completed".
 *
 * Esta regla también debe ser validada por el backend.
 */
export default function RecordCarePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const preselectedAppointmentId = searchParams.get("cita");

  const [appointments, setAppointments] = useState<
    PsychologistAppointment[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    number | null
  >(
    preselectedAppointmentId &&
      !Number.isNaN(Number(preselectedAppointmentId))
      ? Number(preselectedAppointmentId)
      : null,
  );

  const [observation, setObservation] = useState("");

  const [observationError, setObservationError] = useState<
    string | undefined
  >();

  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [wasSaved, setWasSaved] = useState(false);

  useEffect(() => {
    let isMounted = true;

    listPsychologistAppointments()
      .then((result) => {
        if (!isMounted) return;

        setAppointments(
          result.filter(
            (appointment) =>
              appointment.status === "completed" &&
              !appointment.careRecord,
          ),
        );
      })
      .catch(() => {
        if (isMounted) {
          setLoadError(
            "No pudimos cargar tus citas. Intenta de nuevo.",
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedAppointment = appointments.find(
    (appointment) => appointment.id === selectedAppointmentId,
  );

  async function handleSave() {
    if (!selectedAppointmentId) return;

    const error = validateObservation(observation);

    setObservationError(error);

    if (error) return;

    setIsSaving(true);
    setSubmitError(null);

    try {
      await recordCare({
        appointmentId: selectedAppointmentId,
        observation: observation.trim() || null,
      });

      setWasSaved(true);
    } catch {
      setSubmitError(
        "No pudimos guardar el registro. Intenta de nuevo en unos minutos.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (wasSaved) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-primary">
          <CheckCircle2 size={32} aria-hidden />
        </span>

        <h1 className="mt-6 font-display text-2xl font-bold text-text">
          Atención registrada
        </h1>

        <p className="mt-2 text-sm text-text-muted">
          El registro quedó guardado en el historial del consultante.
        </p>

        <div className="mt-8">
            <Button onClick={() => router.push("/consultants")}>
                Volver al listado
            </Button>
            </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/consultants"
        className="inline-flex items-center gap-2 text-sm text-text-muted transition hover:text-primary"
      >
        <ArrowLeft size={16} aria-hidden />
        Volver
      </Link>

      <h1 className="mt-6 font-display text-2xl font-bold text-text">
        Registrar atención
      </h1>

      <p className="mt-2 text-sm text-text-muted">
        Selecciona la cita que atendiste y, si quieres, agrega una
        observación general.
      </p>

      {isLoading && (
        <p className="mt-8 text-sm text-text-subtle">
          Cargando tus citas…
        </p>
      )}

      {loadError && (
        <div className="mt-8">
          <InlineMessage tone="error">
            {loadError}
          </InlineMessage>
        </div>
      )}

      {!isLoading && !loadError && (
        <div className="mt-8 space-y-6 rounded-2xl border border-border bg-surface p-6">
          {appointments.length === 0 ? (
            <p className="text-sm text-text-subtle">
              No tienes citas realizadas pendientes de registro.
            </p>
          ) : (
            <label className="block">
              <span className="text-sm font-semibold text-text">
                Cita
              </span>

              <select
                value={selectedAppointmentId ?? ""}
                onChange={(event) => {
                  const value = event.target.value;

                  setSelectedAppointmentId(
                    value ? Number(value) : null,
                  );

                  setObservationError(undefined);
                  setSubmitError(null);
                }}
                className="mt-2 w-full cursor-pointer rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Selecciona una cita</option>

                {appointments.map((appointment) => (
                  <option
                    key={appointment.id}
                    value={appointment.id}
                  >
                    {appointment.consultantName} —{" "}
                    {formatRelativeDate(appointment.scheduledAt)}
                  </option>
                ))}
              </select>
            </label>
          )}

          {selectedAppointment && (
            <label className="block">
              <span className="text-sm font-medium text-text">
                Observación general (opcional)
              </span>

              <textarea
                value={observation}
                onChange={(event) => {
                  setObservation(event.target.value);
                  setObservationError(undefined);
                }}
                rows={4}
                maxLength={1000}
                placeholder="Ej. Sesión de seguimiento, sin novedades."
                className="mt-2 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40"
              />

              {observationError && (
                <span
                  role="alert"
                  className="mt-1.5 block text-xs text-danger"
                >
                  {observationError}
                </span>
              )}
            </label>
          )}

          {submitError && (
            <InlineMessage tone="error">
              {submitError}
            </InlineMessage>
          )}

          <Button
            onClick={handleSave}
            disabled={!selectedAppointmentId || isSaving}
          >
            {isSaving ? "Guardando…" : "Guardar registro"}
          </Button>
        </div>
      )}
    </div>
  );
}
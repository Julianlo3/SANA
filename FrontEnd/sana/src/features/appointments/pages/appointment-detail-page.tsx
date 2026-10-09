"use client";

import Link from "next/link";
import { ArrowLeft, Lock, MapPin, Video } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import Button from "@/components/ui/button";
import AppointmentStateBadge from "../components/appointment-state-badge";
import SlotPicker from "../components/slot-picker";
import { useAppointmentDetail } from "../hooks/use-appointment-detail";
import {
  APPOINTMENT_MODE_LABELS,
  colombiaToday,
  formatCalendarDate,
  formatDate,
  formatDateTime,
  formatGender,
  formatSlotTime,
  isPlaceholderEmail,
  toColombiaDay,
} from "../lib/appointment-format";

type Props = {
  appointmentId: number;
};

const CARD_CLASS = "rounded-2xl border border-border bg-surface p-6";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-text-subtle">
        {label}
      </p>
      <div className="mt-1 text-sm text-text">{children}</div>
    </div>
  );
}

/**
 * HU-2.3.2 a 2.3.6: detalle de una solicitud y acciones de la asistente.
 * Nunca muestra el motivo de consulta: el backend no lo envía.
 */
export default function AppointmentDetailPage({ appointmentId }: Props) {
  const detail = useAppointmentDetail(appointmentId);
  const { appointment } = detail;

  const backLink = (
    <Link
      href="/solicitudes"
      className="inline-flex items-center gap-2 text-sm text-text-muted transition hover:text-primary"
    >
      <ArrowLeft size={16} aria-hidden />
      Volver a solicitudes
    </Link>
  );

  if (detail.isLoading) {
    return (
      <div className="mx-auto max-w-3xl">
        {backLink}
        <p className="mt-8 text-sm text-text-subtle">Cargando solicitud…</p>
      </div>
    );
  }

  if (detail.loadError || !appointment) {
    return (
      <div className="mx-auto max-w-3xl">
        {backLink}
        <div className="mt-8">
          <InlineMessage tone="error">
            {detail.loadError ?? "No encontramos la solicitud."}
          </InlineMessage>
        </div>
      </div>
    );
  }

  const isPending = appointment.appState === "pendiente";
  const isAssigned = appointment.appState === "asignada";
  const isConfirmed = appointment.appState === "confirmada";
  const canAssign = isPending || (isAssigned && detail.isChangingSlot);
  const canDiscard = isPending || isAssigned;
  const ModeIcon = appointment.appType === "virtual" ? Video : MapPin;

  // Se busca desde el día que prefirió la persona, salvo que ya haya pasado.
  const today = colombiaToday();
  const preferredDay = appointment.appDateIdeal
    ? toColombiaDay(appointment.appDateIdeal)
    : today;
  const defaultDate = preferredDay < today ? today : preferredDay;

  const selectedPsychologist = detail.selection?.slot.psychologists.find(
    (psychologist) => psychologist.id === detail.selection?.psychologistId,
  );

  return (
    <div className="mx-auto max-w-3xl">
      {backLink}

      <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary-dark">
            Solicitud #{appointment.appId}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted">
            <span className="inline-flex items-center gap-1">
              <ModeIcon size={14} aria-hidden />
              {APPOINTMENT_MODE_LABELS[appointment.appType] ??
                appointment.appType}
            </span>
            <span>Recibida {formatDate(appointment.appCreatedAt)}</span>
          </p>
        </div>

        <AppointmentStateBadge state={appointment.appState} />
      </div>

      <div className="mt-6 space-y-6">
        <section className={CARD_CLASS}>
          <h2 className="font-display text-lg font-bold text-text">
            Quien solicita
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Nombre">{appointment.requesterName}</Field>
            <Field label="Documento">
              {appointment.requesterCardType ?? ""}{" "}
              {appointment.requesterIdentityDocument ?? "—"}
            </Field>
            <Field label="Teléfono">
              {appointment.requesterContactNumber ?? "—"}
            </Field>
            <Field label="Correo">
              {isPlaceholderEmail(appointment.requesterEmail) ? (
                <span className="text-text-muted">
                  Sin correo: el sistema guardó uno interno, así que el aviso
                  por correo no llegaría.
                </span>
              ) : (
                (appointment.requesterEmail ?? "—")
              )}
            </Field>
          </div>
        </section>

        <section className={CARD_CLASS}>
          <h2 className="font-display text-lg font-bold text-text">
            {appointment.patientType === "dependent"
              ? "Menor de edad"
              : "Paciente"}
          </h2>

          {appointment.patientType === "dependent" ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Nombre">{appointment.patientName}</Field>
              <Field label="Parentesco del acudiente">
                {appointment.relationshipDescription ?? "—"}
              </Field>
              <Field label="Documento">
                {appointment.patientIdentityDocument ?? "Sin documento"}
              </Field>
              <Field label="Fecha de nacimiento">
                {appointment.patientBirthdate
                  ? formatCalendarDate(appointment.patientBirthdate)
                  : "—"}
              </Field>
              <Field label="Género">
                {formatGender(appointment.patientGender)}
              </Field>
            </div>
          ) : (
            <p className="mt-3 text-sm text-text-muted">
              La persona solicita la cita para sí misma.
            </p>
          )}

          <p className="mt-5 flex items-start gap-2 text-xs text-text-subtle">
            <Lock size={14} className="mt-0.5 shrink-0" aria-hidden />
            El motivo de consulta es visible únicamente para el profesional
            tratante.
          </p>
        </section>

        <section className={CARD_CLASS}>
          <h2 className="font-display text-lg font-bold text-text">Cita</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Psicólogo asignado">
              {appointment.psychologistName ?? "Sin asignar"}
            </Field>
            <Field label="Fecha y hora">
              {appointment.appDate
                ? formatDateTime(appointment.appDate)
                : "Sin asignar"}
            </Field>
            <Field label="Duración">
              {appointment.appDuration
                ? `${appointment.appDuration} minutos`
                : "—"}
            </Field>
            {appointment.secretaryName && (
              <Field label="Gestionada por">{appointment.secretaryName}</Field>
            )}
          </div>
        </section>

        {appointment.appState === "descartada" && (
          <section className="rounded-2xl border border-accent-soft bg-accent-soft/40 p-6">
            <h2 className="font-display text-lg font-bold text-accent-strong">
              Solicitud descartada
            </h2>
            <p className="mt-2 text-sm text-text">
              {appointment.appDiscardReason ?? "Sin motivo registrado."}
            </p>
          </section>
        )}

        {isAssigned && !detail.isChangingSlot && (
          <section className="rounded-2xl border border-primary/30 bg-primary-soft/40 p-6">
            <h2 className="font-display text-lg font-bold text-text">
              Falta confirmar la cita
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              Al confirmar, la franja queda ocupada en la agenda del psicólogo.
              Debe coincidir con la que se asignó.
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={detail.confirm}
                disabled={detail.isWorking || !appointment.appDate}
              >
                {detail.isWorking ? "Confirmando…" : "Confirmar cita"}
              </Button>
              <Button
                variant="secondary"
                onClick={detail.startChangingSlot}
                disabled={detail.isWorking}
              >
                Cambiar horario o psicólogo
              </Button>
            </div>
          </section>
        )}

        {canAssign && (
          <section className={CARD_CLASS}>
            <h2 className="font-display text-lg font-bold text-text">
              {isAssigned ? "Reasignar" : "Asignar psicólogo y horario"}
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Busca los horarios libres, elige la franja y el psicólogo. Si no
              hay ninguno, la solicitud sigue pendiente hasta que se libere un
              cupo.
            </p>

            <div className="mt-5">
              <SlotPicker
                defaultDate={defaultDate}
                selection={detail.selection}
                onSelect={detail.setSelection}
                disabled={detail.isWorking}
              />
            </div>

            {detail.selection && (
              <p className="mt-5 rounded-xl bg-surface-muted px-4 py-3 text-sm text-text">
                Elegiste{" "}
                <strong>
                  {formatCalendarDate(detail.selection.slot.date)},{" "}
                  {formatSlotTime(detail.selection.slot.startTime)} –{" "}
                  {formatSlotTime(detail.selection.slot.endTime)}
                </strong>{" "}
                con <strong>{selectedPsychologist?.name ?? "el psicólogo"}</strong>{" "}
                ({detail.selection.duration} minutos).
              </p>
            )}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={detail.assign}
                disabled={detail.isWorking || !detail.selection}
              >
                {detail.isWorking
                  ? "Guardando…"
                  : isAssigned
                    ? "Reasignar"
                    : "Asignar"}
              </Button>

              {isAssigned && (
                <Button
                  variant="secondary"
                  onClick={detail.cancelChangingSlot}
                  disabled={detail.isWorking}
                >
                  Cancelar el cambio
                </Button>
              )}
            </div>
          </section>
        )}

        {canDiscard && (
          <section className={CARD_CLASS}>
            <h2 className="font-display text-lg font-bold text-text">
              Descartar solicitud
            </h2>

            {detail.isDiscarding ? (
              <div className="mt-3 space-y-4">
                <p className="text-sm text-text-muted">
                  Sale de los pendientes y se conserva el motivo. Úsalo si no
                  corresponde a un servicio de la fundación o está duplicada.
                </p>

                <label className="block">
                  <span className="text-sm font-medium text-text">
                    Motivo del descarte
                  </span>
                  <textarea
                    value={detail.discardReason}
                    onChange={(event) =>
                      detail.setDiscardReason(event.target.value)
                    }
                    rows={3}
                    maxLength={500}
                    placeholder="Ej. Solicitud duplicada, o fuera del servicio de la fundación."
                    className="mt-2 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <span className="mt-1 block text-right text-xs text-text-subtle">
                    {detail.discardReason.length}/500
                  </span>
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    onClick={detail.discard}
                    disabled={detail.isWorking || !detail.discardReason.trim()}
                  >
                    {detail.isWorking ? "Descartando…" : "Descartar definitivamente"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={detail.cancelDiscarding}
                    disabled={detail.isWorking}
                  >
                    Volver
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-3">
                <p className="text-sm text-text-muted">
                  Si la solicitud no se puede atender, puedes descartarla
                  indicando el motivo.
                </p>
                <div className="mt-4">
                  <Button
                    variant="secondary"
                    onClick={detail.startDiscarding}
                    disabled={detail.isWorking}
                  >
                    Descartar solicitud
                  </Button>
                </div>
              </div>
            )}
          </section>
        )}

        {isConfirmed && (
          <section className={CARD_CLASS}>
            <h2 className="font-display text-lg font-bold text-text">
              Cancelar cita
            </h2>

            {detail.isCancelling ? (
              <div className="mt-3 space-y-4">
                <p className="text-sm text-text-muted">
                  Vas a cancelar la cita de{" "}
                  <strong className="text-text">{appointment.patientName}</strong>
                  {appointment.appDate
                    ? ` del ${formatDateTime(appointment.appDate)}`
                    : ""}
                  . Esta acción no se puede deshacer, y el sistema intenta
                  avisar por correo a la persona y al psicólogo.
                </p>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    variant="danger"
                    onClick={detail.cancel}
                    disabled={detail.isWorking}
                  >
                    {detail.isWorking ? "Cancelando…" : "Sí, cancelar cita"}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={detail.stopCancelling}
                    disabled={detail.isWorking}
                  >
                    Volver
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-3">
                <p className="text-sm text-text-muted">
                  Si la persona no puede asistir, puedes cancelar la cita
                  confirmada.
                </p>
                <div className="mt-4">
                  <Button
                    variant="secondary"
                    onClick={detail.startCancelling}
                    disabled={detail.isWorking}
                  >
                    Cancelar cita
                  </Button>
                </div>
              </div>
            )}
          </section>
        )}

        {detail.notice && (
          <div className="rounded-xl border border-primary/30 bg-primary-soft/50 px-4 py-3 text-sm text-text">
            {detail.notice}
          </div>
        )}

        {detail.actionError && (
          <InlineMessage tone="error">{detail.actionError}</InlineMessage>
        )}
      </div>
    </div>
  );
}
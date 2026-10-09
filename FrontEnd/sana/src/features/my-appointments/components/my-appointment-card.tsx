import Link from "next/link";
import { ClipboardCheck, Clock, Lock, MapPin, Video } from "lucide-react";
import AppointmentStateBadge from "@/features/appointments/components/appointment-state-badge";
import {
  APPOINTMENT_MODE_LABELS,
  formatDateTime,
} from "@/features/appointments/lib/appointment-format";
import type { MyAppointment } from "../types/my-appointments-types";

type Props = {
  readonly appointment: MyAppointment;
};

/** Una cita del psicólogo. Si está confirmada, permite pasar a registrar la atención. */
export default function MyAppointmentCard({ appointment }: Props) {
  const ModeIcon = appointment.appType === "virtual" ? Video : MapPin;
  const canRecord = appointment.appState === "confirmada";

  return (
    <article className="flex flex-col rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold text-text-subtle">
          Cita #{appointment.appId}
        </span>
        <AppointmentStateBadge state={appointment.appState} />
      </div>

      <p className="mt-3 font-display text-lg font-bold text-text">
        {appointment.patientName}
      </p>
      {appointment.patientType === "dependent" && (
        <p className="text-xs text-text-muted">Menor de edad</p>
      )}

      <ul className="mt-4 space-y-2 text-xs text-text-muted">
        <li className="flex items-center gap-2">
          <Clock size={14} aria-hidden />
          {appointment.appDate
            ? formatDateTime(appointment.appDate)
            : "Sin fecha"}
        </li>
        <li className="flex items-center gap-2">
          <ModeIcon size={14} aria-hidden />
          {APPOINTMENT_MODE_LABELS[appointment.appType] ?? appointment.appType}
        </li>
      </ul>

      {appointment.appReason && (
        <div className="mt-4 rounded-xl bg-surface-muted px-3 py-2">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-text-subtle">
            <Lock size={12} aria-hidden />
            Motivo de consulta
          </p>
          <p className="mt-1 line-clamp-3 text-xs text-text-muted">
            {appointment.appReason}
          </p>
        </div>
      )}

      {canRecord && (
        <Link
          href={`/registro-atencion/nuevo?cita=${appointment.appId}`}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-white transition hover:bg-primary-dark"
        >
          <ClipboardCheck size={14} aria-hidden />
          Registrar atención
        </Link>
      )}
    </article>
  );
}
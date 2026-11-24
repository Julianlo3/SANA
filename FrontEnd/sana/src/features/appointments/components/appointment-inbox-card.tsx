import Link from "next/link";
import { CalendarDays, Clock, MapPin, User, Video } from "lucide-react";
import AppointmentStateBadge from "./appointment-state-badge";
import {
  APPOINTMENT_MODE_LABELS,
  formatDate,
  formatDateTime,
} from "../lib/appointment-format";
import type { Appointment } from "../types/appointment-types";

type Props = {
  readonly appointment: Appointment;
  readonly heading: string;
  readonly createdAtLabel: string;
  readonly psychologistLabel?: string;
  readonly psychologistSpeciality?: string;
};

/**
 * Renders a linked appointment card used by the secretary inboxes.
 * @param props Appointment and inbox-specific labels.
 * @returns The appointment card.
 */
export default function AppointmentInboxCard({
  appointment,
  heading,
  createdAtLabel,
  psychologistLabel,
  psychologistSpeciality,
}: Props) {
  const ModeIcon = appointment.appType === "virtual" ? Video : MapPin;

  return (
    <Link
      href={`/solicitudes/${appointment.appId}`}
      className="flex flex-col rounded-2xl border border-border bg-surface p-5 transition hover:border-primary hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold text-text-subtle">
          {heading} #{appointment.appId}
        </span>
        <AppointmentStateBadge state={appointment.appState} />
      </div>

      <p className="mt-3 truncate font-display text-lg font-bold text-text">
        {appointment.requesterName}
      </p>
      {appointment.patientType === "dependent" && (
        <p className="truncate text-xs text-text-muted">
          Para el menor {appointment.patientName}
        </p>
      )}

      <ul className="mt-4 space-y-2 text-xs text-text-muted">
        <li className="flex items-center gap-2">
          <ModeIcon size={14} aria-hidden />
          {APPOINTMENT_MODE_LABELS[appointment.appType] ?? appointment.appType}
        </li>
        {appointment.psychologistName && (
          <li
            className={
              psychologistLabel
                ? "flex items-start gap-2"
                : "flex items-center gap-2"
            }
          >
            <User
              size={14}
              className={psychologistLabel ? "mt-0.5 shrink-0" : undefined}
              aria-hidden
            />
            {psychologistLabel ? (
              <div>
                <span>
                  {psychologistLabel}:{" "}
                  <strong className="font-semibold text-text">
                    {appointment.psychologistName}
                  </strong>
                </span>
                {psychologistSpeciality && (
                  <span className="block font-medium text-primary">
                    Especialidad: {psychologistSpeciality}
                  </span>
                )}
              </div>
            ) : (
              appointment.psychologistName
            )}
          </li>
        )}
        <li className="flex items-center gap-2">
          <CalendarDays size={14} aria-hidden />
          {createdAtLabel} {formatDate(appointment.appCreatedAt)}
        </li>
        {appointment.appDate && (
          <li className="flex items-center gap-2">
            <Clock size={14} aria-hidden />
            {formatDateTime(appointment.appDate)}
          </li>
        )}
      </ul>
    </Link>
  );
}

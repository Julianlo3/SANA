import { CalendarDays, Clock, MapPin, User, Video } from "lucide-react";
import Button from "@/components/ui/button";
import AppointmentStateBadge from "@/features/appointments/components/appointment-state-badge";
import {
  APPOINTMENT_MODE_LABELS,
  formatDate,
  formatDateTime,
} from "@/features/appointments/lib/appointment-format";
import type { AppointmentState } from "@/features/appointments/types/appointment-types";
import type { MyRequest } from "../types/my-account-types";

type Props = {
  readonly request: MyRequest;
};

/** Estados en los que la persona todavía puede cancelar. El backend también lo valida. */
const CANCELABLE_STATES: readonly AppointmentState[] = [
  "pendiente",
  "asignada",
  "confirmada",
];

/** Una solicitud de cita de la persona, con su estado y, si ya hay, fecha y psicólogo. */
export default function RequestCard({ request }: Props) {
  const ModeIcon = request.appType === "virtual" ? Video : MapPin;
  const canCancel = CANCELABLE_STATES.includes(request.appState);

  return (
    <article className="flex flex-col rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-semibold text-text-subtle">
          Solicitud #{request.appId}
        </span>
        <AppointmentStateBadge state={request.appState} />
      </div>

      <p className="mt-3 font-display text-lg font-bold text-text">
        {request.patientType === "dependent"
          ? `Para ${request.patientName}`
          : "Para ti"}
      </p>

      <ul className="mt-4 space-y-2 text-xs text-text-muted">
        <li className="flex items-center gap-2">
          <ModeIcon size={14} aria-hidden />
          {APPOINTMENT_MODE_LABELS[request.appType] ?? request.appType}
        </li>
        <li className="flex items-center gap-2">
          <CalendarDays size={14} aria-hidden />
          Enviada {formatDate(request.appCreatedAt)}
        </li>
        {request.psychologistName && (
          <li className="flex items-center gap-2">
            <User size={14} aria-hidden />
            {request.psychologistName}
          </li>
        )}
        {request.appDate && (
          <li className="flex items-center gap-2">
            <Clock size={14} aria-hidden />
            {formatDateTime(request.appDate)}
          </li>
        )}
      </ul>

      {canCancel && (
        <div className="mt-5">
          <Button variant="secondary" disabled onClick={() => undefined}>
            Cancelar cita
          </Button>
        </div>
      )}
    </article>
  );
}
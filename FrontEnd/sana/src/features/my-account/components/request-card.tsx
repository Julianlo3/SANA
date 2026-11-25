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

/**
 * Defines the props type.
 */
type Props = {
  readonly request: MyRequest;
  readonly onCancel: (request: MyRequest) => void;
};

/** Appointment states that allow cancellation or withdrawal. */
const CANCELABLE_STATES: readonly AppointmentState[] = [
  "pendiente",
  "asignada",
  "confirmada",
];

/** Card accent color mapped to appointment state. */
const STATE_ACCENT: Record<AppointmentState, string> = {
  pendiente: "#f2b134",
  asignada: "#43acb6",
  confirmada: "#2e9b6a",
  realizada: "#134176",
  cancelada: "#eb5886",
  descartada: "#9ca3af",
  remitida: "#2B52B2",
};

/**
 * Renders a card displaying the details of a request, including its state, type, date, and associated actions such as cancellation or withdrawal.
 * @param param0 The props object containing the request and onCancel callback.
 * @returns The JSX element representing the request card.
 */
export default function RequestCard({ request, onCancel }: Props) {
  const ModeIcon = request.appType === "virtual" ? Video : MapPin;
  const canCancel = CANCELABLE_STATES.includes(request.appState);
  const isAssessment = request.appKind === "valoracion";
  const actionLabel =
    request.appState === "confirmada" ? "Cancelar cita" : "Retirar solicitud";

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-shadow hover:shadow-md">
      <div
        aria-hidden
        className="h-1.5"
        style={{ backgroundColor: STATE_ACCENT[request.appState] }}
      />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-text-subtle">
              Solicitud #{request.appId}
            </span>
            <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-navy">
              {isAssessment ? "Valoración" : "Sesión de paquete"}
            </span>
          </div>
          <AppointmentStateBadge state={request.appState} />
        </div>

        <p className="mt-4 font-display text-xl font-bold text-text">
          {request.patientType === "dependent"
            ? `Para ${request.patientName}`
            : "Para ti"}
        </p>

        {request.appDate ? (
          <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-primary-dark">
            <Clock size={16} aria-hidden />
            {formatDateTime(request.appDate)}
          </p>
        ) : (
          <p className="mt-2 text-sm text-text-muted">
            Aún no tiene fecha. Te contactaremos para confirmarla.
          </p>
        )}

        <ul className="mt-4 space-y-2 text-xs text-text-muted">
          <li className="flex items-center gap-2">
            <ModeIcon size={14} aria-hidden />
            {APPOINTMENT_MODE_LABELS[request.appType] ?? request.appType}
          </li>
          {request.psychologistName && (
            <li className="flex items-center gap-2">
              <User size={14} aria-hidden />
              {request.psychologistName}
            </li>
          )}
          <li className="flex items-center gap-2">
            <CalendarDays size={14} aria-hidden />
            Enviada {formatDate(request.appCreatedAt)}
          </li>
        </ul>

        {canCancel && (
          <div className="mt-5 border-t border-border pt-4">
            <Button variant="secondary" onClick={() => onCancel(request)}>
              {actionLabel}
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
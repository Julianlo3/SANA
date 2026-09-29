import { APPOINTMENT_STATE_LABELS } from "../lib/appointment-format";
import type { AppointmentState } from "../types/appointment-types";

/** Colores por estado: son señales funcionales, no de identidad de marca. */
const STATE_STYLES: Record<AppointmentState, string> = {
  pendiente: "bg-highlight text-[#8A6A18]",
  asignada: "bg-primary-soft text-primary-dark",
  confirmada: "bg-[#E6F4EA] text-[#1E7A44]",
  descartada: "bg-accent-soft text-accent-strong",
  cancelada: "bg-surface-muted text-text-subtle",
  realizada: "bg-primary-soft text-primary-dark",
};

export default function AppointmentStateBadge({
  state,
}: {
  state: AppointmentState;
}) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATE_STYLES[state] ?? "bg-surface-muted text-text-subtle"}`}
    >
      {APPOINTMENT_STATE_LABELS[state] ?? state}
    </span>
  );
}
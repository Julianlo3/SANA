import type {
  AppointmentMode,
  AppointmentState,
} from "../types/appointment-types";

/** Todas las fechas se muestran en hora de Colombia, sin importar dónde esté el navegador. */
const TIME_ZONE = "America/Bogota";

const DATE_FORMAT = new Intl.DateTimeFormat("es-CO", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
});

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("es-CO", {
  timeZone: TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});

/** Formato "2026-10-05", útil para los campos de fecha. */
const DAY_KEY_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
});

/** Fecha con zona horaria, como la de creación de la solicitud. */
export function formatDate(iso: string): string {
  return DATE_FORMAT.format(new Date(iso));
}

/** Fecha y hora de una cita. */
export function formatDateTime(iso: string): string {
  return DATE_TIME_FORMAT.format(new Date(iso));
}

/**
 * Fecha sin hora, como la de nacimiento ("1990-05-10"). No se convierte de
 * zona horaria: si se hiciera, saldría un día antes.
 */
export function formatCalendarDate(date: string): string {
  const [year, month, day] = date.slice(0, 10).split("-").map(Number);

  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

/** El día ("2026-10-05") que corresponde a un instante, en hora de Colombia. */
export function toColombiaDay(iso: string): string {
  return DAY_KEY_FORMAT.format(new Date(iso));
}

/** El día de hoy ("2026-10-05"), en hora de Colombia. */
export function colombiaToday(): string {
  return DAY_KEY_FORMAT.format(new Date());
}

/** Las horas llegan como "08:00" o "08:00:00"; se muestran sin segundos. */
export function formatSlotTime(time: string): string {
  return time.slice(0, 5);
}

export const APPOINTMENT_STATE_LABELS: Record<AppointmentState, string> = {
  pendiente: "Pendiente",
  asignada: "Asignada",
  confirmada: "Confirmada",
  descartada: "Descartada",
  cancelada: "Cancelada",
  realizada: "Realizada",
};

export const APPOINTMENT_MODE_LABELS: Record<AppointmentMode, string> = {
  presencial: "Presencial",
  virtual: "Virtual",
};

const GENDER_LABELS: Record<string, string> = {
  F: "Femenino",
  M: "Masculino",
  O: "Otro",
  P: "Prefiere no decir",
};

/** El backend guarda el género en una letra. */
export function formatGender(code: string | null): string {
  if (!code) return "No indicado";
  return GENDER_LABELS[code] ?? code;
}

/**
 * Cuando no se da un correo, el backend guarda uno inventado con este
 * formato (doc_<documento>@sana.org). No es una dirección real.
 */
export function isPlaceholderEmail(email: string | null): boolean {
  return email !== null && /^doc_\d+@sana\.org$/i.test(email);
}
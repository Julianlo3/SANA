import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import type {
  Appointment,
  AppointmentSlotPayload,
  AppointmentState,
  AvailabilityQuery,
  AvailabilitySlot,
  DiscardAppointmentPayload,
  PsychologistOption,
} from "../types/appointment-types";

/**
 * Única puerta de entrada a la bandeja de solicitudes (HU-2.3).
 *
 * Habla con el backend real, sin mocks. Todos los endpoints exigen el rol
 * "secretario": un administrador sin ese rol recibe 403.
 *
 * Flujo: pendiente → asignar (franja provisional) → confirmar (definitiva).
 * También se puede descartar mientras esté pendiente o asignada.
 */

/** Zona horaria de Colombia, sin horario de verano. Si las horas salen desfasadas, se ajusta solo aquí. */
const COLOMBIA_UTC_OFFSET = "-05:00";

/**
 * Arma el instante ISO de una franja a partir de la fecha y la hora que
 * devuelve la disponibilidad. Asignar y confirmar deben mandar el mismo
 * valor, porque el backend compara las dos fechas.
 */
export function buildSlotDateTime(date: string, time: string): string {
  const day = date.slice(0, 10);
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  return `${day}T${normalizedTime}${COLOMBIA_UTC_OFFSET}`;
}

/** HU-2.3.1: lista las solicitudes, las más recientes primero. */
export async function listAppointments(
  state?: AppointmentState,
  signal?: AbortSignal,
): Promise<Appointment[]> {
  const url = state
    ? `${ENDPOINTS.appointments}?${new URLSearchParams({ state }).toString()}`
    : ENDPOINTS.appointments;

  return httpClient.get<Appointment[]>(url, signal);
}

/** HU-2.3.2: detalle de una solicitud, sin motivo de consulta. */
export async function getAppointment(
  id: number,
  signal?: AbortSignal,
): Promise<Appointment> {
  return httpClient.get<Appointment>(ENDPOINTS.appointment(id), signal);
}

/** Psicólogos activos para el selector de asignación. */
export async function listPsychologistOptions(
  signal?: AbortSignal,
): Promise<PsychologistOption[]> {
  return httpClient.get<PsychologistOption[]>(
    ENDPOINTS.appointmentPsychologists,
    signal,
  );
}

/** HU-2.3.3 y 2.3.4: franjas libres. Una lista vacía significa que no hay cupo. */
export async function findAvailability(
  query: AvailabilityQuery,
  signal?: AbortSignal,
): Promise<AvailabilitySlot[]> {
  const params = new URLSearchParams({
    appointmentStart: query.appointmentStart,
    duration: String(query.duration),
    delayHours: String(query.delayHours),
  });

  if (query.psychologistIds && query.psychologistIds.length > 0) {
    params.set("psychologistIds", query.psychologistIds.join(","));
  }

  return httpClient.get<AvailabilitySlot[]>(
    `${ENDPOINTS.scheduleAvailability}?${params.toString()}`,
    signal,
  );
}

/**
 * HU-2.3.3 y 2.3.5: asigna un psicólogo y una franja provisional.
 * Sirve también para reasignar una solicitud que ya estaba asignada.
 * El backend responde 409 (SCHEDULE_SLOT_TAKEN) si la franja se ocupó.
 */
export async function assignAppointment(
  id: number,
  payload: AppointmentSlotPayload,
): Promise<Appointment> {
  return httpClient.patch<Appointment>(ENDPOINTS.appointmentAssign(id), payload);
}

/**
 * Confirma una solicitud ya asignada. Debe llevar exactamente el mismo
 * psicólogo, fecha y duración de la asignación, o el backend responde 400.
 * Al confirmar es cuando debe salir la notificación al consultante, pero hoy
 * el backend solo la deja registrada en el log.
 */
export async function confirmAppointment(
  id: number,
  payload: AppointmentSlotPayload,
): Promise<Appointment> {
  return httpClient.patch<Appointment>(
    ENDPOINTS.appointmentConfirm(id),
    payload,
  );
}

/** HU-2.3.6: descarta una solicitud pendiente o asignada, guardando el motivo. */
export async function discardAppointment(
  id: number,
  payload: DiscardAppointmentPayload,
): Promise<Appointment> {
  return httpClient.patch<Appointment>(
    ENDPOINTS.appointmentDiscard(id),
    payload,
  );
}

/** Cambia una cita abierta a "cancelada" o "realizada". */
export async function updateAppointmentStatus(
  id: number,
  state: "cancelada" | "realizada",
): Promise<Appointment> {
  return httpClient.patch<Appointment>(ENDPOINTS.appointmentStatus(id), {
    state,
  });
}
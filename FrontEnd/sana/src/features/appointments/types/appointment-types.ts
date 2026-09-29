/**
 * Tipos de la bandeja de solicitudes de cita (HU-2.3).
 *
 * Reflejan lo que devuelve el backend real (módulo appointments): los
 * estados y las modalidades van en español porque así se guardan en la base.
 *
 * HU-2.4.1: ninguna de estas respuestas trae el motivo de consulta. Las
 * consultas del backend para la asistente no seleccionan app_reason, así que
 * no hay nada que ocultar en el frontend.
 */

export type AppointmentState =
  | "pendiente"
  | "asignada"
  | "confirmada"
  | "descartada"
  | "cancelada"
  | "realizada";

export type AppointmentMode = "presencial" | "virtual";

/** "self": la persona pide para sí misma. "dependent": un acudiente pide para un menor. */
export type PatientType = "self" | "dependent";

/** Una solicitud o cita, tal como la devuelve GET /appointments. */
export type Appointment = {
  appId: number;
  appState: AppointmentState;
  appType: AppointmentMode;
  /** Fecha y hora asignada o confirmada. Es null mientras esté pendiente. */
  appDate: string | null;
  /** Fecha que la persona prefería al pedir la cita: solo una referencia. */
  appDateIdeal: string | null;
  /** Duración en minutos. */
  appDuration: number | null;
  appDiscardReason: string | null;
  appCreatedAt: string;
  requesterId: number;
  requesterName: string;
  requesterCardType: string | null;
  requesterIdentityDocument: number | null;
  requesterContactNumber: string | null;
  requesterEmail: string | null;
  patientType: PatientType;
  patientName: string;
  patientIdentityDocument: string | null;
  patientBirthdate: string | null;
  patientGender: string | null;
  psychologistId: number | null;
  psychologistName: string | null;
  secretaryName: string | null;
  /** Parentesco del acudiente con el menor. Solo si patientType es "dependent". */
  relationshipDescription: string | null;
};

/** Un psicólogo activo, para el selector de asignación. */
export type PsychologistOption = {
  psyId: number;
  name: string;
  speciality: string;
  licenseNumber: number;
};

/** Una franja libre. Varios psicólogos pueden estar libres en la misma. */
export type AvailabilitySlot = {
  date: string;
  startTime: string;
  endTime: string;
  psychologists: { id: number; name: string; speciality: string }[];
};

/** Parámetros de GET /schedule/availability. */
export type AvailabilityQuery = {
  /** Instante ISO desde el cual se busca. */
  appointmentStart: string;
  /** Duración de la cita en minutos (1 a 480). */
  duration: number;
  /** Ventana de búsqueda hacia adelante, en horas (1 a 24). */
  delayHours: number;
  /** Limita la búsqueda a estos psicólogos. */
  psychologistIds?: number[];
};

/** Asignar (provisional) y confirmar (definitivo) llevan lo mismo. */
export type AppointmentSlotPayload = {
  psyId: number;
  /** Instante ISO de la franja. Debe ser idéntico al asignar y al confirmar. */
  appDate: string;
  appDuration: number;
};

export type DiscardAppointmentPayload = {
  /** Entre 1 y 500 caracteres. */
  reason: string;
};
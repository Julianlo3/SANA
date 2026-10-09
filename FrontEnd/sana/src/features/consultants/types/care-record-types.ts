/**
 * Tipos del registro de atención (HU-2.5).
 *
 * El psicólogo marca una cita como realizada y agrega una observación
 * general, opcional. Solo puede registrarse sobre citas en estado
 * "realizada" — no sobre programadas ni canceladas (HU-2.5.7).
 */

/** Estado de una cita, tal como la ve el psicólogo desde su agenda. */
export type AppointmentStatus = "scheduled" | "completed" | "cancelled";

/** Lo que el psicólogo envía al registrar una atención. */
export type RecordCarePayload = {
  appointmentId: number;
  /** Opcional (HU-2.5.2 y HU-2.5.3): puede guardarse sin observación. */
  observation: string | null;
};

/** Respuesta tras registrar la atención. */
export type CareRecordReceipt = {
  id: number;
  appointmentId: number;
  attendedAt: string;
  recordedAt: string;
};

/**
 * Una cita en la agenda del psicólogo, con lo necesario para decidir si
 * puede registrarle la atención (HU-2.5.1 y HU-2.5.7).
 */
export type PsychologistAppointment = {
  id: number;
  consultantId: number;
  consultantName: string;
  scheduledAt: string;
  status: AppointmentStatus;
  /** Presente solo si la cita ya tiene una atención registrada. */
  careRecord: {
    observation: string | null;
    recordedAt: string;
  } | null;
};
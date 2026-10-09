import type {
  AppointmentMode,
  PatientType,
} from "@/features/appointments/types/appointment-types";

/** Estados que el backend permite pedir en GET /appointments/my-appointments. */
export type MyAppointmentState = "confirmada" | "realizada" | "cancelada";

/**
 * Una cita del psicólogo, tal como la devuelve GET /appointments/my-appointments.
 * El motivo de consulta solo lo ve el psicólogo tratante.
 */
export type MyAppointment = {
  appId: number;
  appState: MyAppointmentState;
  appType: AppointmentMode;
  appDate: string | null;
  appDuration: number | null;
  patientType: PatientType;
  patientName: string;
  appReason?: string | null;
};
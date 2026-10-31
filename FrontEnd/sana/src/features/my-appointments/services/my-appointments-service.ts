import { httpClient } from "@/services/api/http-client";
import { ENDPOINTS } from "@/services/api/endpoints";
import type {
  AppointmentClinicalNote,
  MyAppointment,
  MyAppointmentState,
} from "../types/my-appointments-types";

/** Citas del psicólogo que inició sesión, filtradas por estado. */
export async function listMyAppointments(
  state: MyAppointmentState,
  signal?: AbortSignal,
): Promise<MyAppointment[]> {
  return httpClient.get<MyAppointment[]>(
    `/appointments/my-appointments?state=${state}`,
    signal,
  );
}

/**
 * Fetches the clinical notes for a specific appointment. 
 * @param appointmentId The ID of the appointment for which to fetch clinical notes.
 * @returns A promise that resolves to an array of AppointmentClinicalNote objects.
 */
export async function getAppointmentClinicalNotes(
  appointmentId: number,
): Promise<AppointmentClinicalNote[]> {
  return httpClient.get<AppointmentClinicalNote[]>(
    ENDPOINTS.clinicalNotesForAppointment(appointmentId),
  );
}
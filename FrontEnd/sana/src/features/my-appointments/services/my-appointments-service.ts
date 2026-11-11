import { httpClient } from "@/services/api/http-client";
import { ENDPOINTS } from "@/services/api/endpoints";
import type {
  AppointmentClinicalNote,
  MyAppointment,
  MyAppointmentState,
} from "../types/my-appointments-types";

/**
 * Lists my appointments.
 * @param state Current status value.
 * @param signal Optional. Request cancellation signal.
 * @returns A promise resolving to the operation result.
 */

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
 * Retrieves appointment clinical notes.
 * @param appointmentId Resource identifier.
 * @returns A promise resolving to the operation result.
 */

export async function getAppointmentClinicalNotes(
  appointmentId: number,
): Promise<AppointmentClinicalNote[]> {
  return httpClient.get<AppointmentClinicalNote[]>(
    ENDPOINTS.clinicalNotesForAppointment(appointmentId),
  );
}
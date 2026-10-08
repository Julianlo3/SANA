import { httpClient } from "@/services/api/http-client";
import type {
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
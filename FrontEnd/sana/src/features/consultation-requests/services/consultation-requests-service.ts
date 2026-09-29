import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import type {
  ConsultationRequestPayload,
  ConsultationRequestReceipt,
} from "../types/consultation-request-types";

/**
 * Envía una solicitud pública de cita al backend real
 * (POST /appointments/request, sin autenticación).
 *
 * No hay mocks: este endpoint ya existe y está probado (ver
 * BackEnd/backendsana/src/appointments/appointments.controller.ts).
 * Toda solicitud queda en estado "pendiente"; la asistente es quien la
 * asigna, confirma o descarta desde su bandeja (HU-2.3).
 */
export async function submitConsultationRequest(
  payload: ConsultationRequestPayload,
): Promise<ConsultationRequestReceipt> {
  return httpClient.post<ConsultationRequestReceipt>(
    ENDPOINTS.consultationRequests,
    payload,
  );
}
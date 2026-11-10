import { ENDPOINTS } from "@/services/api/endpoints";
import { httpClient } from "@/services/api/http-client";
import { buildSlotDateTime, getColombiaToday } from "@/lib/date/slot-datetime";
import type {
  ConsultantAvailabilitySlot,
  ConsultationRequestPayload,
  ConsultationRequestReceipt,
} from "../types/consultation-request-types";

/**
 * Submits a consultation request to the backend.
 * @param payload Request data.
 * @returns The created request receipt.
 */
export async function submitConsultationRequest(
  payload: ConsultationRequestPayload,
): Promise<ConsultationRequestReceipt> {
  return httpClient.post<ConsultationRequestReceipt>(
    ENDPOINTS.consultationRequests,
    payload,
  );
}

/**
 * Retrieves consultant availability.
 * @param signal Optional. Request cancellation signal.
 * @returns A promise resolving to the operation result.
 */

export async function fetchConsultantAvailability(
  signal?: AbortSignal,
): Promise<ConsultantAvailabilitySlot[]> {
  // Start at Colombia midnight so hourly slots align to whole hours.
  const todayBogota = getColombiaToday();
  const appointmentStart = buildSlotDateTime(todayBogota, "00:00:00");

  const params = new URLSearchParams({
    appointmentStart,
    delayHours: "720",
    duration: "60",
  });

  return httpClient.get<ConsultantAvailabilitySlot[]>(
    `${ENDPOINTS.consultantAvailability}?${params.toString()}`,
    signal,
  );
}

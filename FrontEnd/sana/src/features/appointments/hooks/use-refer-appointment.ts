"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/types/api-types";
import {
  listReferralPsychologists,
  referAppointment,
} from "../services/appointments-service";
import type {
  ReferAppointmentPayload,
  ReferralPsychologistOption,
} from "../types/appointment-types";

/** Maximum characters allowed in the referral reason. */
export const MAX_REFERRAL_REASON_LENGTH = 1000;

type PsychologistLoadState =
  | { appointmentId: number; status: "loading" }
  | {
      appointmentId: number;
      status: "ready";
      psychologists: ReferralPsychologistOption[];
    }
  | { appointmentId: number; status: "error"; error: string };

/**
 * Loads eligible psychologists and handles the referral submission for a valuation appointment.
 * @param appointmentId Valuation appointment to refer (must be 'confirmada' or 'realizada').
 * @param onSuccess Callback invoked after the referral is created successfully.
 */
export function useReferAppointment(
  appointmentId: number,
  onSuccess: () => void,
) {
  const [psychologistLoad, setPsychologistLoad] =
    useState<PsychologistLoadState>({
      appointmentId,
      status: "loading",
    });

  const [targetPsychologistId, setTargetPsychologistId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isCurrentLoad = psychologistLoad.appointmentId === appointmentId;
  const isLoadingPsychologists =
    !isCurrentLoad || psychologistLoad.status === "loading";
  const psychologists =
    isCurrentLoad && psychologistLoad.status === "ready"
      ? psychologistLoad.psychologists
      : [];
  const loadError =
    isCurrentLoad && psychologistLoad.status === "error"
      ? psychologistLoad.error
      : null;

  useEffect(() => {
    const controller = new AbortController();

    listReferralPsychologists(appointmentId, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setPsychologistLoad({
            appointmentId,
            status: "ready",
            psychologists: result,
          });
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setPsychologistLoad({
          appointmentId,
          status: "error",
          error:
            error instanceof ApiError
              ? error.message
              : "No pudimos cargar los psicólogos disponibles.",
        });
      });

    return () => controller.abort();
  }, [appointmentId]);

  /**
   * Submits the referral to the backend.
   * @returns A promise resolving when the referral completes.
   */
  const submit = useCallback(async () => {
    if (targetPsychologistId === null) {
      setSubmitError("Selecciona un psicólogo al que remitir.");
      return;
    }

    const trimmedReason = reason.trim();
    if (trimmedReason.length > MAX_REFERRAL_REASON_LENGTH) {
      setSubmitError(`El motivo no puede superar ${MAX_REFERRAL_REASON_LENGTH} caracteres.`);
      return;
    }

    const payload: ReferAppointmentPayload = { targetPsychologistId };
    if (trimmedReason) payload.reason = trimmedReason;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await referAppointment(appointmentId, payload);
      onSuccess();
    } catch (error: unknown) {
      const apiError = error instanceof ApiError ? error : null;
      // Known business-rule codes from the backend
      if (apiError?.code === "APPOINTMENT_ALREADY_REFERRED") {
        setSubmitError("Esta valoración ya fue remitida anteriormente.");
      } else if (apiError?.code === "PACKAGE_ALREADY_EXISTS") {
        setSubmitError("Ya existe un paquete sugerido para esta valoración. No se puede remitir.");
      } else if (apiError?.code === "ACTIVE_CARE_PACKAGE_EXISTS") {
        setSubmitError("El paciente ya tiene un paquete de atención activo.");
      } else if (apiError?.code === "REFERRAL_LOOP_DETECTED") {
        setSubmitError("No se puede remitir a ese psicólogo porque ya participó en la cadena de esta valoración.");
      } else {
        setSubmitError(
          apiError?.message ?? "No pudimos completar la remisión. Intenta de nuevo.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [appointmentId, targetPsychologistId, reason, onSuccess]);

  return {
    psychologists,
    isLoadingPsychologists,
    loadError,
    targetPsychologistId,
    setTargetPsychologistId,
    reason,
    setReason,
    isSubmitting,
    submitError,
    submit,
  };
}

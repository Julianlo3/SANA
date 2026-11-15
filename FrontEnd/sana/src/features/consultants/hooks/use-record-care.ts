"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/types/api-types";
import type {
  PackagePriority,
  SuggestCarePackagePayload,
} from "@/features/care-packages/types/care-package-types";
import {
  completeAppointment,
  listPsychologistAppointments,
  recordCare,
  suggestPackageAfterAssessment,
} from "../services/care-record-service";
import type { PsychologistAppointment } from "../types/care-record-types";
import { validateObservation } from "../validation/care-record-validation";

/**
 * Converts an operation error into a user-facing message.
 * @param error Error returned by the attempted operation.
 * @param fallback Message used when the error is not an API error.
 * @returns The API error message or the supplied fallback.
 */
function messageFrom(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

function getPackageSuggestion(
  appId: number,
  isAssessment: boolean,
  packagePriority: PackagePriority | "",
  suggestedSessionLimit: string,
): {
  suggestion: SuggestCarePackagePayload | null;
  validationError?: string;
} {
  if (!isAssessment) return { suggestion: null };

  const parsedSessionLimit =
    suggestedSessionLimit.trim() === ""
      ? undefined
      : Number(suggestedSessionLimit);
  if (
    !packagePriority ||
    parsedSessionLimit === undefined ||
    !Number.isInteger(parsedSessionLimit) ||
    parsedSessionLimit < 1
  ) {
    return {
      suggestion: null,
      validationError:
        "Selecciona la prioridad e indica un número entero de citas sugeridas mayor que cero.",
    };
  }

  return {
    suggestion: {
      assessmentAppointmentId: appId,
      priority: packagePriority,
      sessionLimit: parsedSessionLimit,
    },
  };
}

async function completeAppointmentForRecord(
  appId: number,
  packageSuggestion: SuggestCarePackagePayload | null,
): Promise<void> {
  if (packageSuggestion) {
    await suggestPackageAfterAssessment(packageSuggestion);
    return;
  }
  await completeAppointment(appId);
}

function completionErrorFallback(
  packageSuggestion: SuggestCarePackagePayload | null,
): string {
  return packageSuggestion
    ? "No pudimos guardar la prioridad y sugerir el paquete."
    : "No pudimos marcar la cita como realizada. Intenta de nuevo.";
}

/**
 * Manages care record submission as separate completion and note requests.
 * If note registration fails after completion, preserves the appointment ID
 * so only the note request needs to be retried.
 * @param preselectedId Optional appointment identifier selected by the route.
 * @returns Appointment data, form state, validation messages, and save handlers.
 */
export function useRecordCare(preselectedId: number | null) {
  const [appointments, setAppointments] = useState<PsychologistAppointment[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(preselectedId);
  const [observation, setObservation] = useState("");
  const [observationError, setObservationError] = useState<
    string | undefined
  >();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [packagePriority, setPackagePriority] = useState<PackagePriority | "">("");
  const [suggestedSessionLimit, setSuggestedSessionLimit] = useState("");

  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [wasSaved, setWasSaved] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    listPsychologistAppointments(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setAppointments(
          [...result].sort((a, b) =>
            (a.appDate ?? "").localeCompare(b.appDate ?? ""),
          ),
        );
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          messageFrom(error, "No pudimos cargar tus citas. Intenta de nuevo."),
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  const selectedAppointment = appointments.find(
    (appointment) => appointment.appId === selectedId,
  );
  const isAssessment = selectedAppointment?.appKind === "valoracion";

  /**
   * Selects an appointment and resets assessment-specific form values.
   * @param id Appointment identifier, or null to clear the selection.
   * @returns Nothing.
   */
  const selectAppointment = useCallback((id: number | null) => {
    setSelectedId(id);
    setPackagePriority("");
    setSuggestedSessionLimit("");
    setObservationError(undefined);
    setSubmitError(null);
  }, []);

  /**
   * Updates the optional care observation.
   * @param value New observation text.
   * @returns Nothing.
   */
  const changeObservation = useCallback((value: string) => {
    setObservation(value);
    setObservationError(undefined);
  }, []);

  /**
   * Completes the appointment and records its clinical note.
   * @returns A promise that resolves when saving finishes.
   */
  const save = useCallback(async () => {
    if (!selectedAppointment) return;

    const appId = selectedAppointment.appId;

    const validationError = validateObservation(observation);
    setObservationError(validationError);
    if (validationError) return;

    if (!termsAccepted) {
      setSubmitError("Acepta los términos para registrar la atención.");
      return;
    }

    const packageSuggestionResult = getPackageSuggestion(
      appId,
      isAssessment,
      packagePriority,
      suggestedSessionLimit,
    );
    if (packageSuggestionResult.validationError) {
      setSubmitError(packageSuggestionResult.validationError);
      return;
    }
    const packageSuggestion = packageSuggestionResult.suggestion;

    setIsSaving(true);
    setSubmitError(null);

    if (!completedIds.includes(appId)) {
      try {
        await completeAppointmentForRecord(appId, packageSuggestion);
        setCompletedIds((current) => [...current, appId]);
      } catch (error: unknown) {
        setSubmitError(
          messageFrom(
            error,
            completionErrorFallback(packageSuggestion),
          ),
        );
        setIsSaving(false);
        return;
      }
    }

    try {
      await recordCare({
        appId,
        observation: observation.trim() || undefined,
        termsAccepted: true,
      });
      setAppointments((current) =>
        current.filter((appointment) => appointment.appId !== appId),
      );
      setWasSaved(true);
    } catch (error: unknown) {
      setSubmitError(
        `La cita ya quedó marcada como realizada, pero no pudimos guardar la observación. ${messageFrom(
          error,
          "Intenta de nuevo.",
        )}`,
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    selectedAppointment,
    observation,
    termsAccepted,
    completedIds,
    isAssessment,
    packagePriority,
    suggestedSessionLimit,
  ]);

  return {
    appointments,
    isLoading,
    loadError,
    selectedAppointment,
    selectAppointment,
    observation,
    changeObservation,
    observationError,
    termsAccepted,
    setTermsAccepted,
    isAssessment,
    packagePriority,
    setPackagePriority,
    suggestedSessionLimit,
    setSuggestedSessionLimit,
    isSaving,
    submitError,
    wasSaved,
    save,
  };
}
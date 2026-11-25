"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/types/api-types";
import type { SlotSelection } from "../components/slot-picker";
import {
  assignAppointment,
  buildSlotDateTime,
  confirmAppointment,
  discardAppointment,
  getAppointment,
  getPatientPsychologistHistory,
  listPsychologistOptions,
  updateAppointmentStatus,
} from "../services/appointments-service";
import type {
  Appointment,
  AppointmentMode,
  PatientPsychologistHistory,
  PsychologistOption,
} from "../types/appointment-types";

/**
 * Defines the confirm notice.
 */
const CONFIRM_NOTICE = "Cita confirmada.";
/**
 * Defines the cancel notice.
 */
const CANCEL_NOTICE = "Cita cancelada.";

/**
 * Implements the message from operation.
 * @param error Error value to process.
 * @param fallback fallback input.
 * @returns Formatted value or validation message.
 */
function messageFrom(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

/**
 * Loads an appointment and exposes its assignment, confirmation, discard, and cancellation actions.
 * Also provides active psychologist options with their clinical specializations.
 * @param appointmentId Resource identifier.
 * @returns Appointment detail state, psychologist options, and handlers.
 */
export function useAppointmentDetail(appointmentId: number) {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [psychologistOptions, setPsychologistOptions] = useState<
    PsychologistOption[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [psychologistHistoryState, setPsychologistHistoryState] = useState<{
    appointmentId: number;
    history: PatientPsychologistHistory[];
    error: string | null;
  }>({ appointmentId, history: [], error: null });

  const [isWorking, setIsWorking] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [selection, setSelection] = useState<SlotSelection | null>(null);
  const [selectedMode, setSelectedMode] = useState<AppointmentMode | null>(null);
  const [isChangingSlot, setIsChangingSlot] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [discardReason, setDiscardReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      getAppointment(appointmentId, controller.signal),
      listPsychologistOptions(controller.signal),
    ])
      .then(([appResult, psyResults]) => {
        if (!controller.signal.aborted) {
          setAppointment(appResult);
          setSelectedMode(appResult.appType);
          setPsychologistOptions(psyResults);
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadError(
          messageFrom(error, "No pudimos cargar la solicitud. Intenta de nuevo."),
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [appointmentId]);

  useEffect(() => {
    const controller = new AbortController();

    getPatientPsychologistHistory(appointmentId, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setPsychologistHistoryState({
            appointmentId,
            history: result,
            error: null,
          });
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setPsychologistHistoryState({
          appointmentId,
          history: [],
          error: messageFrom(
            error,
            "No pudimos cargar la racha de atención de este paciente.",
          ),
        });
      });

    return () => controller.abort();
  }, [appointmentId]);

  /** Executes a backend action and updates the detail state. */
  const run = useCallback(
    async (action: () => Promise<Appointment>, successNotice: string) => {
      setIsWorking(true);
      setActionError(null);
      setNotice(null);

      try {
        const updated = await action();
        setAppointment((current) =>
          updated.referredFromAppId == null &&
          current?.referredFromAppId != null
            ? {
                ...updated,
                referredFromAppId: current.referredFromAppId,
              }
            : updated,
        );
        setSelectedMode(updated.appType);
        setNotice(successNotice);
        setSelection(null);
        setIsChangingSlot(false);
        setIsDiscarding(false);
        setDiscardReason("");
        setIsCancelling(false);
      } catch (error: unknown) {
        setActionError(
          messageFrom(error, "No pudimos completar la acción. Intenta de nuevo."),
        );
      } finally {
        setIsWorking(false);
      }
    },
    [],
  );

  /** HU-2.3.3 y 2.3.5: asigna, o reasigna si ya estaba asignada o remitida. */
  const assign = useCallback(async () => {
    if (!selection) return;

    if (
      (appointment?.appState === "remitida" ||
        appointment?.referredFromAppId != null) &&
      appointment.psychologistId !== null &&
      selection.psychologistId !== appointment.psychologistId
    ) {
      setActionError(
        "Esta valoración fue remitida a un psicólogo específico. Debes seleccionarlo en el calendario para mantener la remisión.",
      );
      return;
    }

    await run(
      () =>
        assignAppointment(appointmentId, {
          psyId: selection.psychologistId,
          appDate: buildSlotDateTime(
            selection.slot.date,
            selection.slot.startTime,
          ),
          appDuration: selection.duration,
          appType: selectedMode ?? undefined,
        }),
      "Solicitud asignada. Falta confirmar la cita.",
    );
  }, [appointment, appointmentId, run, selectedMode, selection]);

  /** Confirms the appointment using the exact interval previously assigned. */
  const confirm = useCallback(async () => {
    if (!appointment) return;

    const { appId, psychologistId, appDate, appDuration } = appointment;
    if (psychologistId === null || appDate === null || appDuration === null) {
      return;
    }

    await run(
      () =>
        confirmAppointment(appId, {
          psyId: psychologistId,
          appDate,
          appDuration,
        }),
      CONFIRM_NOTICE,
    );
  }, [appointment, run]);

  /** Discards the request and persists the supplied reason. */
  const discard = useCallback(async () => {
    const reason = discardReason.trim();

    if (!reason) {
      setActionError("Escribe el motivo del descarte.");
      return;
    }

    await run(
      () => discardAppointment(appointmentId, { reason }),
      "Solicitud descartada.",
    );
  }, [appointmentId, discardReason, run]);

  /** Cancels a confirmed appointment; other states cannot be cancelled by the backend. */
  const cancel = useCallback(async () => {
    await run(
      () => updateAppointmentStatus(appointmentId, "cancelada"),
      CANCEL_NOTICE,
    );
  }, [appointmentId, run]);

  const startChangingSlot = useCallback(() => {
    setIsDiscarding(false);
    setIsCancelling(false);
    setActionError(null);
    setNotice(null);
    setIsChangingSlot(true);
  }, []);

  const cancelChangingSlot = useCallback(() => {
    setSelection(null);
    setIsChangingSlot(false);
    setActionError(null);
  }, []);

  const startDiscarding = useCallback(() => {
    setIsChangingSlot(false);
    setIsCancelling(false);
    setSelection(null);
    setActionError(null);
    setNotice(null);
    setIsDiscarding(true);
  }, []);

  const cancelDiscarding = useCallback(() => {
    setIsDiscarding(false);
    setDiscardReason("");
    setActionError(null);
  }, []);

  const startCancelling = useCallback(() => {
    setIsChangingSlot(false);
    setIsDiscarding(false);
    setSelection(null);
    setActionError(null);
    setNotice(null);
    setIsCancelling(true);
  }, []);

  const stopCancelling = useCallback(() => {
    setIsCancelling(false);
    setActionError(null);
  }, []);

  return {
    appointment,
    psychologistOptions,
    isLoading,
    loadError,
    psychologistHistory:
      psychologistHistoryState.appointmentId === appointmentId
        ? psychologistHistoryState.history
        : [],
    psychologistHistoryError:
      psychologistHistoryState.appointmentId === appointmentId
        ? psychologistHistoryState.error
        : null,
    isWorking,
    actionError,
    notice,
    selection,
    setSelection,
    selectedMode,
    setSelectedMode,
    isChangingSlot,
    startChangingSlot,
    cancelChangingSlot,
    isDiscarding,
    startDiscarding,
    cancelDiscarding,
    discardReason,
    setDiscardReason,
    isCancelling,
    startCancelling,
    stopCancelling,
    assign,
    confirm,
    discard,
    cancel,
  };
}

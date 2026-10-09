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
  updateAppointmentStatus,
} from "../services/appointments-service";
import type { Appointment } from "../types/appointment-types";

const CONFIRM_NOTICE = "Cita confirmada.";
const CANCEL_NOTICE = "Cita cancelada.";

function messageFrom(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

/** Lógica del detalle de una solicitud: carga, asignar, confirmar, descartar y cancelar. */
export function useAppointmentDetail(appointmentId: number) {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isWorking, setIsWorking] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [selection, setSelection] = useState<SlotSelection | null>(null);
  const [isChangingSlot, setIsChangingSlot] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [discardReason, setDiscardReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    getAppointment(appointmentId, controller.signal)
      .then((result) => setAppointment(result))
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

  /** Ejecuta una acción del backend y deja la pantalla en el estado nuevo. */
  const run = useCallback(
    async (action: () => Promise<Appointment>, successNotice: string) => {
      setIsWorking(true);
      setActionError(null);
      setNotice(null);

      try {
        const updated = await action();
        setAppointment(updated);
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

  /** HU-2.3.3 y 2.3.5: asigna, o reasigna si ya estaba asignada. */
  const assign = useCallback(async () => {
    if (!selection) return;

    await run(
      () =>
        assignAppointment(appointmentId, {
          psyId: selection.psychologistId,
          appDate: buildSlotDateTime(
            selection.slot.date,
            selection.slot.startTime,
          ),
          appDuration: selection.duration,
        }),
      "Solicitud asignada. Falta confirmar la cita.",
    );
  }, [appointmentId, run, selection]);

  /** Confirma con exactamente la misma franja que se asignó. */
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

  /** HU-2.3.6: descarta la solicitud guardando el motivo. */
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

  /** Cancela una cita ya confirmada. El backend no admite cancelar desde otro estado. */
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
    isLoading,
    loadError,
    isWorking,
    actionError,
    notice,
    selection,
    setSelection,
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
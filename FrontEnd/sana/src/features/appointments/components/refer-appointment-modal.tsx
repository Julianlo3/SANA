"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import Button from "@/components/ui/button";
import InlineMessage from "@/components/feedback/inline-message";
import { MAX_REFERRAL_REASON_LENGTH, useReferAppointment } from "../hooks/use-refer-appointment";

/**
 * Props for the referral dialog.
 */
type Props = {
  /** Valuation appointment ID to refer (must be 'confirmada'). */
  readonly appointmentId: number;
  /** Patient name shown in the confirmation prompt. */
  readonly patientName: string;
  /** Called when the user closes the dialog without acting. */
  readonly onClose: () => void;
  /** Called after the referral is created successfully. */
  readonly onSuccess: () => void;
};

/**
 * Modal dialog that lets a psychologist refer a valuation appointment to another psychologist.
 * Loads eligible psychologists from GET /appointments/:id/referral-psychologists and
 * submits POST /appointments/:id/refer on confirmation.
 * @param props Dialog properties.
 * @returns Rendered dialog.
 */
export default function ReferAppointmentModal({
  appointmentId,
  patientName,
  onClose,
  onSuccess,
}: Props) {
  const ref = useReferAppointment(appointmentId, onSuccess);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="refer-modal-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!ref.isSubmitting) onClose();
      }}
      className="fixed inset-0 z-50 m-0 flex h-full w-full max-h-none max-w-none items-center justify-center overflow-y-auto border-0 bg-transparent p-4 [&::backdrop]:bg-black/40"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 rounded-lg p-1 text-text-muted hover:bg-surface-muted hover:text-text"
        >
          <X size={18} aria-hidden />
        </button>

        <h2
          id="refer-modal-title"
          className="font-display text-xl font-bold text-primary-dark"
        >
          Remitir valoración
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Paciente: <strong className="text-text">{patientName}</strong>
        </p>
        <p className="mt-2 text-xs text-text-subtle">
          La valoración actual quedará como realizada y se creará una nueva cita
          de valoración asignada al psicólogo elegido, pendiente de horario por
          secretaría.
        </p>

        {ref.loadError && (
          <div className="mt-4">
            <InlineMessage tone="error">{ref.loadError}</InlineMessage>
          </div>
        )}

        {ref.isLoadingPsychologists && (
          <p className="mt-4 text-sm text-text-subtle">
            Cargando psicólogos disponibles…
          </p>
        )}

        {!ref.isLoadingPsychologists && !ref.loadError && (
          <div className="mt-4 space-y-4">
            {ref.psychologists.length === 0 ? (
              <p className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-text-muted">
                No hay psicólogos disponibles para remitir esta valoración en
                este momento.
              </p>
            ) : (
              <div>
                <p className="mb-2 text-sm font-semibold text-text">
                  Selecciona el psicólogo destino
                </p>
                <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                  {ref.psychologists.map((psy) => {
                    const selected = ref.targetPsychologistId === psy.psyId;
                    return (
                      <button
                        key={psy.psyId}
                        type="button"
                        onClick={() => ref.setTargetPsychologistId(psy.psyId)}
                        aria-pressed={selected}
                        className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                          selected
                            ? "border-primary bg-primary text-white"
                            : "border-border bg-surface text-text hover:border-primary hover:text-primary"
                        }`}
                      >
                        <span className="font-semibold">{psy.name}</span>
                        {psy.speciality && (
                          <span
                            className={`ml-2 text-xs ${selected ? "text-white/80" : "text-text-muted"}`}
                          >
                            · {psy.speciality}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <label className="block">
              <span className="text-sm font-semibold text-text">
                Motivo de la remisión{" "}
                <span className="font-normal text-text-muted">(opcional)</span>
              </span>
              <textarea
                value={ref.reason}
                onChange={(e) => ref.setReason(e.target.value)}
                rows={3}
                maxLength={MAX_REFERRAL_REASON_LENGTH}
                placeholder="Describe el motivo clínico o administrativo de la remisión."
                className="mt-2 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <span className="mt-1 block text-right text-xs text-text-subtle">
                {ref.reason.length}/{MAX_REFERRAL_REASON_LENGTH}
              </span>
            </label>
          </div>
        )}

        {ref.submitError && (
          <div className="mt-4">
            <InlineMessage tone="error">{ref.submitError}</InlineMessage>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={ref.submit}
            disabled={
              ref.isSubmitting ||
              ref.isLoadingPsychologists ||
              ref.targetPsychologistId === null ||
              ref.psychologists.length === 0
            }
          >
            {ref.isSubmitting ? "Remitiendo…" : "Confirmar remisión"}
          </Button>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={ref.isSubmitting}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </dialog>
  );
}

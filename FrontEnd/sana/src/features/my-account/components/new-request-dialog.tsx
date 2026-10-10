import { CalendarPlus } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import Button from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import AppointmentModeField from "@/features/consultation-requests/components/appointment-mode-field";
import DataPolicyConsent from "@/features/consultation-requests/components/data-policy-consent";
import { useNewRequest } from "../hooks/use-new-request";
import type { OwnProfile } from "../types/my-account-types";

type Props = {
  readonly profile: OwnProfile;
  readonly onCreated: () => void;
  readonly onClose: () => void;
};

/** Ventana para pedir una cita nueva para sí mismo, con los datos del perfil. */
export default function NewRequestDialog({
  profile,
  onCreated,
  onClose,
}: Props) {
  const request = useNewRequest(profile, onCreated);
  const isBlocked = request.missing.length > 0;

  return (
    <Modal
      title="Solicitar una nueva cita"
      icon={
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
          <CalendarPlus size={20} aria-hidden />
        </div>
      }
      onClose={onClose}
      footer={
        isBlocked ? (
          <Button variant="secondary" onClick={onClose}>
            Entendido
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={request.isSaving}
            >
              Cancelar
            </Button>
            <Button onClick={request.submit} disabled={request.isSaving}>
              {request.isSaving ? "Enviando…" : "Enviar solicitud"}
            </Button>
          </>
        )
      }
    >
      {isBlocked ? (
        <p>
          Antes de pedir una cita completa en «Editar mis datos»:{" "}
          {request.missing.join(", ")}.
        </p>
      ) : (
        <div className="space-y-5">
          <p>
            Usaremos los datos de tu cuenta. Solo cuéntanos cómo prefieres la
            cita. Es para ti: si necesitas una para un menor, envía el
            formulario desde el inicio.
          </p>

          <AppointmentModeField
            value={request.appType}
            error={request.errors.appType}
            onChange={request.setAppType}
            onBlur={() => undefined}
          />

          <label className="block">
            <span className="text-sm font-medium text-text">
              Motivo de la consulta (opcional)
            </span>
            <textarea
              value={request.reason}
              onChange={(event) => request.setReason(event.target.value)}
              rows={3}
              maxLength={1000}
              className="mt-2 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {request.errors.reason && (
              <span role="alert" className="mt-1.5 block text-xs text-danger">
                {request.errors.reason}
              </span>
            )}
          </label>

          <DataPolicyConsent
            checked={request.accepted}
            onChange={request.setAccepted}
            error={request.errors.accepted}
            policyType="data_treatment"
          />

          {request.submitError && (
            <InlineMessage tone="error">{request.submitError}</InlineMessage>
          )}
        </div>
      )}
    </Modal>
  );
}
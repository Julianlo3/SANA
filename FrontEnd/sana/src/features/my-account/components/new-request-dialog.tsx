import { CalendarPlus } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import AppointmentModeField from "@/features/consultation-requests/components/appointment-mode-field";
import ConsultationReasonField from "@/features/consultation-requests/components/consultation-reason-field";
import DataPolicyConsent from "@/features/consultation-requests/components/data-policy-consent";
import AppointmentRequestDialog from "./appointment-request-dialog";
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

  return (
    <AppointmentRequestDialog
      title="Solicitar una nueva cita"
      icon={
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
          <CalendarPlus size={20} aria-hidden />
        </div>
      }
      missing={request.missing}
      isSaving={request.isSaving}
      onSubmit={request.submit}
      onClose={onClose}
    >
      <div className="space-y-5">
          <p>
            Usaremos los datos de tu cuenta. Solo cuéntanos cómo prefieres la
            cita.
          </p>

          <AppointmentModeField
            value={request.appType}
            error={request.errors.appType}
            onChange={request.setAppType}
            onBlur={() => undefined}
          />

          <ConsultationReasonField
            value={request.reason}
            error={request.errors.reason}
            onChange={request.setReason}
          />

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
    </AppointmentRequestDialog>
  );
}
"use client";

import { UserPlus } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import AppointmentModeField from "@/features/consultation-requests/components/appointment-mode-field";
import ConsultationReasonField from "@/features/consultation-requests/components/consultation-reason-field";
import DataPolicyConsent from "@/features/consultation-requests/components/data-policy-consent";
import DependentPersonFields from "@/features/consultation-requests/components/dependent-person-fields";
import ValidatedSelectField from "@/features/consultation-requests/components/validated-select-field";
import AppointmentRequestDialog from "./appointment-request-dialog";
import { useNewDependentRequest } from "../hooks/use-new-dependent-request";
import type { OwnProfile } from "../types/my-account-types";

type Props = {
  readonly profile: OwnProfile;
  readonly onCreated: () => void;
  readonly onClose: () => void;
};

/**
 * Component for creating a new dependent request. It displays a modal dialog where the user can fill in the details of the dependent and submit the request.
 * @param param0 The props containing the user's profile, a callback for when the request is created, and a callback for closing the dialog.
 * @returns A React component that renders a modal dialog for creating a new dependent request.
 */
export default function NewDependentRequestDialog({
  profile,
  onCreated,
  onClose,
}: Props) {
  const request = useNewDependentRequest(profile, onCreated);

  return (
    <AppointmentRequestDialog
      title="Solicitar cita para un dependiente"
      icon={
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
          <UserPlus size={20} aria-hidden />
        </div>
      }
      missing={request.missing}
      isSaving={request.isSaving}
      onSubmit={request.submit}
      onClose={onClose}
    >
      <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
        <p>
          Usaremos los datos de tu cuenta como acudiente. Completa los datos
          del menor; el teléfono y la residencia serán los de tu perfil.
        </p>

        <fieldset className="space-y-4">
          <legend className="font-semibold text-text">Datos del dependiente</legend>
          <DependentPersonFields
            fullName={request.values.name}
            birthdate={request.values.birthdate}
            gender={request.values.gender}
            identityDocument={request.values.identityDocument}
            confirmIdentityDocument={request.values.confirmIdentityDocument}
            errors={{
              fullName: request.errors.name,
              birthdate: request.errors.birthdate,
              gender: request.errors.gender,
              identityDocument: request.errors.identityDocument,
              confirmIdentityDocument: request.errors.confirmIdentityDocument,
            }}
            onFullNameChange={(value) => request.setField("name", value)}
            onBirthdateChange={(value) => request.setField("birthdate", value)}
            onGenderChange={(value) => request.setField("gender", value)}
            onIdentityDocumentChange={(value) =>
              request.setField("identityDocument", value)
            }
            onConfirmIdentityDocumentChange={(value) =>
              request.setField("confirmIdentityDocument", value)
            }
            nameLabel="Nombre completo"
            genderLabel="Género"
            identityDocumentLabel="Documento de identidad"
            confirmIdentityDocumentLabel="Confirma el documento"
            identityDocumentHint="Escribe el número del registro civil o de la tarjeta de identidad."
            layout="stacked"
          />
          <ValidatedSelectField
            label="Parentesco con el menor"
            value={request.values.relationship}
            options={request.relationships}
            error={request.errors.relationship}
            onChange={(relationship) =>
              request.setField(
                "relationship",
                relationship
                  ? (Number(relationship) as 1 | 2 | 3 | 4)
                  : "",
              )
            }
          />
        </fieldset>

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
          checked={request.requesterAccepted}
          onChange={request.setRequesterAccepted}
          error={request.errors.requesterAccepted}
          policyType="data_treatment"
        />
        <DataPolicyConsent
          checked={request.dependentAccepted}
          onChange={request.setDependentAccepted}
          error={request.errors.dependentAccepted}
          policyType="dependent_consent"
        />

        {request.submitError && (
          <InlineMessage tone="error">{request.submitError}</InlineMessage>
        )}
      </div>
    </AppointmentRequestDialog>
  );
}

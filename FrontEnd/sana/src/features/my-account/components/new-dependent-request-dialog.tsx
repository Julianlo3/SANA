"use client";

import { UsersRound } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import AppointmentModeField from "@/features/consultation-requests/components/appointment-mode-field";
import ConsultationReasonField from "@/features/consultation-requests/components/consultation-reason-field";
import DataPolicyConsent from "@/features/consultation-requests/components/data-policy-consent";
import { ACCOUNT_DEPENDENT_REQUEST_CONSENT } from "@/content/legal";
import DependentPersonFields from "@/features/consultation-requests/components/dependent-person-fields";
import ConsultantSlotPicker from "@/features/consultation-requests/components/consultant-slot-picker";
import ValidatedSelectField from "@/features/consultation-requests/components/validated-select-field";
import AppointmentRequestDialog from "./appointment-request-dialog";
import { useNewDependentRequest } from "../hooks/use-new-dependent-request";
import type { OwnProfile } from "../types/my-account-types";
import type { CarePackage } from "@/features/care-packages/types/care-package-types";

/**
 * Props required to create a valuation request for a dependent.
 */
type Props = {
  readonly profile: OwnProfile;
  readonly carePackages: readonly CarePackage[];
  readonly onCreated: () => void;
  readonly onClose: () => void;
};

/**
 * Renders the dependent valuation request dialog.
 * @param props Guardian profile and request dialog callbacks.
 * @returns The dependent valuation request dialog.
 */
export default function NewDependentRequestDialog({
  profile,
  carePackages,
  onCreated,
  onClose,
}: Props) {
  const request = useNewDependentRequest(profile, onCreated, carePackages);

  return (
    <AppointmentRequestDialog
      title="Solicitar valoración para un dependiente"
      icon={
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
          <UsersRound size={20} aria-hidden />
        </div>
      }
      missing={request.missing}
      isSaving={request.isSaving}
      submissionBlocked={Boolean(request.packageRestrictionMessage)}
      blockedMessage={
        request.packageRestrictionMessage ? (
          <p>
            {request.packageRestrictionMessage}{" "}
            <a
              href="#mis-paquetes"
              onClick={onClose}
              className="font-semibold text-primary underline"
            >
              Ver mis paquetes
            </a>
          </p>
        ) : undefined
      }
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

        {!request.packageRestrictionMessage && (
          <>
            <AppointmentModeField
              department={request.residenceDepartment}
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

            <fieldset className="space-y-3">
              <legend className="font-semibold text-text">
                Horario de la valoración
              </legend>
              <p className="text-sm text-text-muted">
                Selecciona un horario disponible. Al reservarlo, se asignará un
                psicólogo disponible para atender al dependiente.
              </p>
              <ConsultantSlotPicker
                availableDays={request.availableDays}
                slotsForDay={request.slotsForDay}
                isLoading={request.isAvailabilityLoading}
                error={request.availabilityError}
                onReload={request.reloadAvailability}
                selectedSlot={request.selectedSlot}
                onSelect={request.setSelectedSlot}
                disabled={request.isSaving}
              />
              {request.errors.appDate && (
                <p role="alert" className="text-xs text-danger">
                  {request.errors.appDate}
                </p>
              )}
            </fieldset>

            <DataPolicyConsent
              checked={request.accepted}
              onChange={request.setAccepted}
              error={request.errors.accepted}
              label={ACCOUNT_DEPENDENT_REQUEST_CONSENT}
            />
          </>
        )}

        {request.submitError && (
          <InlineMessage tone="error">{request.submitError}</InlineMessage>
        )}
      </div>
    </AppointmentRequestDialog>
  );
}

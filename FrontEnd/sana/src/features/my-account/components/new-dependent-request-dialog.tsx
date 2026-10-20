"use client";

import { UserPlus } from "lucide-react";
import InlineMessage from "@/components/feedback/inline-message";
import TextField from "@/components/forms/text-field";
import Button from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import AppointmentModeField from "@/features/consultation-requests/components/appointment-mode-field";
import DataPolicyConsent from "@/features/consultation-requests/components/data-policy-consent";
import type { Gender } from "@/features/consultation-requests/types/consultation-request-types";
import { keepDigits } from "@/lib/format/text";
import { useNewDependentRequest } from "../hooks/use-new-dependent-request";
import type { OwnProfile } from "../types/my-account-types";

type Props = {
  readonly profile: OwnProfile;
  readonly onCreated: () => void;
  readonly onClose: () => void;
};

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "M", label: "Hombre" },
  { value: "F", label: "Mujer" },
  { value: "O", label: "Otro" },
  { value: "P", label: "No quiero especificar" },
];

const INPUT_CLASS =
  "mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/40";

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
  const isBlocked = request.missing.length > 0;

  return (
    <Modal
      title="Solicitar cita para un dependiente"
      icon={
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
          <UserPlus size={20} aria-hidden />
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
          Antes de solicitar la cita completa en «Editar mis datos»:{" "}
          {request.missing.join(", ")}.
        </p>
      ) : (
        <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
          <p>
            Usaremos los datos de tu cuenta como acudiente. Completa los datos
            del menor; el teléfono y la residencia serán los de tu perfil.
          </p>

          <fieldset className="space-y-4">
            <legend className="font-semibold text-text">Datos del dependiente</legend>
            <TextField
              label="Nombre completo"
              required
              value={request.values.name}
              error={request.errors.name}
              maxLength={100}
              onChange={(value) => request.setField("name", value)}
            />
            <TextField
              label="Documento de identidad"
              required
              value={request.values.identityDocument}
              error={request.errors.identityDocument}
              hint="Escribe el número del registro civil o de la tarjeta de identidad."
              inputMode="numeric"
              maxLength={12}
              onChange={(value) =>
                request.setField("identityDocument", keepDigits(value))
              }
            />
            <TextField
              label="Confirma el documento"
              required
              value={request.values.confirmIdentityDocument}
              error={request.errors.confirmIdentityDocument}
              inputMode="numeric"
              maxLength={12}
              onChange={(value) =>
                request.setField("confirmIdentityDocument", keepDigits(value))
              }
            />
            <label className="block">
              <span className="text-sm font-semibold text-text">
                Fecha de nacimiento <span className="text-danger" aria-hidden>*</span>
              </span>
              <input
                type="date"
                value={request.values.birthdate}
                max={new Date().toISOString().split("T")[0]}
                onChange={(event) =>
                  request.setField("birthdate", event.target.value)
                }
                aria-invalid={Boolean(request.errors.birthdate)}
                className={INPUT_CLASS}
              />
              {request.errors.birthdate && (
                <span role="alert" className="mt-1.5 block text-xs text-danger">
                  {request.errors.birthdate}
                </span>
              )}
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-text">
                Género <span className="text-danger" aria-hidden>*</span>
              </span>
              <select
                value={request.values.gender}
                onChange={(event) =>
                  request.setField("gender", event.target.value as Gender | "")
                }
                aria-invalid={Boolean(request.errors.gender)}
                className={`${INPUT_CLASS} cursor-pointer`}
              >
                <option value="">Selecciona</option>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {request.errors.gender && (
                <span role="alert" className="mt-1.5 block text-xs text-danger">
                  {request.errors.gender}
                </span>
              )}
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-text">
                Parentesco con el menor{" "}
                <span className="text-danger" aria-hidden>*</span>
              </span>
              <select
                value={request.values.relationship}
                onChange={(event) =>
                  request.setField(
                    "relationship",
                    event.target.value
                      ? (Number(event.target.value) as 1 | 2 | 3 | 4)
                      : "",
                  )
                }
                aria-invalid={Boolean(request.errors.relationship)}
                className={`${INPUT_CLASS} cursor-pointer`}
              >
                <option value="">Selecciona</option>
                {request.relationships.map((relationship) => (
                  <option key={relationship.id} value={relationship.id}>
                    {relationship.label}
                  </option>
                ))}
              </select>
              {request.errors.relationship && (
                <span role="alert" className="mt-1.5 block text-xs text-danger">
                  {request.errors.relationship}
                </span>
              )}
            </label>
          </fieldset>

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
      )}
    </Modal>
  );
}

"use client";

import { useCallback, useMemo, useState } from "react";
import { submitConsultationRequest } from "@/features/consultation-requests/services/consultation-requests-service";
import type {
  AppointmentMode,
  CardType,
  Gender,
  GuardianRelationshipId,
  GuardianRequestPayload,
} from "@/features/consultation-requests/types/consultation-request-types";
import {
  validateAdultBirthDate,
  validateAppointmentMode,
  validateConfirmMinorIdentityDocument,
  validateConsultationReason,
  validateDataPolicy,
  validateEmail,
  validateGender,
  validateIdentityDocument,
  validateMinorBirthDate,
  validateMinorIdentityDocument,
  validateRelationship,
  validateFullName,
  validatePhone,
} from "@/features/consultation-requests/validation/consultation-request-validation";
import { ApiError } from "@/types/api-types";
import type { OwnProfile } from "../types/my-account-types";

const CARD_TYPES = new Set(["CC", "TI", "CE"]);
const GENDERS = new Set(["F", "M", "O", "P"]);

const RELATIONSHIPS: readonly {
  value: GuardianRelationshipId;
  label: string;
}[] = [
  { value: 1, label: "Madre" },
  { value: 2, label: "Padre" },
  { value: 3, label: "Tío/a" },
  { value: 4, label: "Abuelo/a" },
];

type DependentRequestValues = {
  name: string;
  identityDocument: string;
  confirmIdentityDocument: string;
  birthdate: string;
  gender: Gender | "";
  relationship: GuardianRelationshipId | "";
};

/**
 * Gets the list of missing profile data fields.
 * @param profile The user's profile data.
 * @returns An array of strings representing the missing fields.
 */
function getMissingProfileData(profile: OwnProfile): string[] {
  const missing: string[] = [];

  if (validateFullName(profile.fullName)) missing.push("nombre completo");
  if (
    validateIdentityDocument(profile.identityDocument ?? "") ||
    !CARD_TYPES.has(profile.cardType ?? "")
  ) {
    missing.push("tipo y número de documento");
  }
  if (validatePhone(profile.phone ?? "")) missing.push("teléfono");
  if (validateAdultBirthDate(profile.birthdate?.slice(0, 10) ?? "")) {
    missing.push("fecha de nacimiento (mayor de edad)");
  }
  if (
    !profile.gender ||
    validateGender(profile.gender) ||
    !GENDERS.has(profile.gender)
  ) {
    missing.push("género");
  }
  if (validateEmail(profile.email)) missing.push("correo válido");

  return missing;
}

/**
 * Hook for managing the creation of a new dependent request.
 * @param profile The user's profile data.
 * @param onCreated A callback function to be called when the request is created.
 * @returns An object containing the state and functions for managing the dependent request.
 */
export function useNewDependentRequest(
  profile: OwnProfile,
  onCreated: () => void,
) {
  const [values, setValues] = useState<DependentRequestValues>({
    name: "",
    identityDocument: "",
    confirmIdentityDocument: "",
    birthdate: "",
    gender: "",
    relationship: "",
  });
  const [appType, setAppType] = useState<AppointmentMode | "">("");
  const [reason, setReason] = useState("");
  const [requesterAccepted, setRequesterAccepted] = useState(false);
  const [dependentAccepted, setDependentAccepted] = useState(false);
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const missing = useMemo(() => getMissingProfileData(profile), [profile]);
  const errors = useMemo(
    () => ({
      name: validateFullName(values.name),
      identityDocument: validateMinorIdentityDocument(values.identityDocument),
      confirmIdentityDocument: validateConfirmMinorIdentityDocument(
        values.identityDocument,
        values.confirmIdentityDocument,
      ),
      birthdate: validateMinorBirthDate(values.birthdate),
      gender: validateGender(values.gender),
      relationship: validateRelationship(values.relationship),
      appType: validateAppointmentMode(appType),
      reason: validateConsultationReason(reason),
      requesterAccepted: validateDataPolicy(requesterAccepted),
      dependentAccepted: validateDataPolicy(dependentAccepted),
    }),
    [values, appType, reason, requesterAccepted, dependentAccepted],
  );

  const visibleErrors = wasSubmitted
    ? errors
    : {
        name: undefined,
        identityDocument: undefined,
        confirmIdentityDocument: undefined,
        birthdate: undefined,
        gender: undefined,
        relationship: undefined,
        appType: undefined,
        reason: undefined,
        requesterAccepted: undefined,
        dependentAccepted: undefined,
      };

  const setField = useCallback(
    <K extends keyof DependentRequestValues>(
      field: K,
      value: DependentRequestValues[K],
    ) => {
      setValues((current) => ({ ...current, [field]: value }));
    },
    [],
  );

  const submit = useCallback(async () => {
    setWasSubmitted(true);
    if (Object.values(errors).some(Boolean)) return;

    const payload: GuardianRequestPayload = {
      patientType: "dependent",
      requesterName: profile.fullName.trim(),
      requesterCardType: profile.cardType as CardType,
      requesterIdentityDocument: profile.identityDocument ?? "",
      requesterContactNumber: profile.phone?.trim() ?? "",
      requesterEmail: profile.email.trim().toLowerCase(),
      requesterBirthdate: profile.birthdate?.slice(0, 10) ?? "",
      requesterGender: profile.gender as Gender,
      requesterTermsAccepted: true,
      dependentName: values.name.trim(),
      dependentIdentityDocument: values.identityDocument.trim(),
      dependentBirthdate: values.birthdate,
      dependentGender: values.gender as Gender,
      dependentContactNumber: profile.phone?.trim() ?? "",
      relationshipId: values.relationship as GuardianRelationshipId,
      dependentTermsAccepted: true,
      appType: appType as AppointmentMode,
      appReason: reason.trim(),
      appDateIdeal: null,
      residenceZone: profile.residenceZone?.trim() || undefined,
    };

    setIsSaving(true);
    setSubmitError(null);

    try {
      await submitConsultationRequest(payload);
      onCreated();
    } catch (error: unknown) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : "No pudimos enviar tu solicitud. Intenta de nuevo en unos minutos.",
      );
    } finally {
      setIsSaving(false);
    }
  }, [errors, profile, values, appType, reason, onCreated]);

  return {
    missing,
    values,
    setField,
    appType,
    setAppType,
    reason,
    setReason,
    requesterAccepted,
    setRequesterAccepted,
    dependentAccepted,
    setDependentAccepted,
    errors: visibleErrors,
    isSaving,
    submitError,
    submit,
    relationships: RELATIONSHIPS,
  };
}

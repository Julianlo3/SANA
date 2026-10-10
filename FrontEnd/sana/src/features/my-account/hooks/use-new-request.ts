"use client";

import { useCallback, useMemo, useState } from "react";
import { submitConsultationRequest } from "@/features/consultation-requests/services/consultation-requests-service";
import type {
  AppointmentMode,
  CardType,
  Gender,
  SelfRequestPayload,
} from "@/features/consultation-requests/types/consultation-request-types";
import {
  validateAdultBirthDate,
  validateAppointmentMode,
  validateConsultationReason,
  validateDataPolicy,
  validateGender,
  validatePhone,
} from "@/features/consultation-requests/validation/consultation-request-validation";
import { ApiError } from "@/types/api-types";
import type { OwnProfile } from "../types/my-account-types";

const CARD_TYPES: readonly string[] = ["CC", "TI", "CE"];

/** Datos del perfil que el envío exige y que hoy no están completos. */
function missingProfileData(profile: OwnProfile): string[] {
  const missing: string[] = [];

  if (
    !profile.identityDocument ||
    !profile.cardType ||
    !CARD_TYPES.includes(profile.cardType)
  ) {
    missing.push("tipo y número de documento");
  }
  if (validatePhone(profile.phone ?? "")) missing.push("teléfono");
  if (validateAdultBirthDate(profile.birthdate?.slice(0, 10) ?? "")) {
    missing.push("fecha de nacimiento (mayor de edad)");
  }
  if (validateGender(profile.gender ?? "")) missing.push("género");

  return missing;
}

/**
 * Pedir una cita nueva para sí mismo, sin llenar de nuevo todo el formulario.
 * Los datos personales salen del perfil; la persona solo elige modalidad,
 * escribe el motivo y autoriza el tratamiento de datos.
 */
export function useNewRequest(profile: OwnProfile, onCreated: () => void) {
  const [appType, setAppType] = useState<AppointmentMode | "">("");
  const [reason, setReason] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const missing = useMemo(() => missingProfileData(profile), [profile]);

  const errors = useMemo(
    () => ({
      appType: validateAppointmentMode(appType),
      reason: validateConsultationReason(reason),
      accepted: validateDataPolicy(accepted),
    }),
    [appType, reason, accepted],
  );

  const visibleErrors = wasSubmitted
    ? errors
    : { appType: undefined, reason: undefined, accepted: undefined };

  const submit = useCallback(async () => {
    setWasSubmitted(true);
    if (errors.appType || errors.reason || errors.accepted) return;

    const payload: SelfRequestPayload = {
      patientType: "self",
      requesterName: profile.fullName,
      requesterCardType: (profile.cardType ?? "") as CardType,
      requesterIdentityDocument: profile.identityDocument ?? "",
      requesterContactNumber: (profile.phone ?? "").trim(),
      requesterEmail: profile.email.trim().toLowerCase(),
      requesterBirthdate: profile.birthdate?.slice(0, 10) ?? "",
      requesterGender: (profile.gender ?? "") as Gender,
      requesterTermsAccepted: true,
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
  }, [errors, profile, appType, reason, onCreated]);

  return {
    missing,
    appType,
    setAppType,
    reason,
    setReason,
    accepted,
    setAccepted,
    errors: visibleErrors,
    isSaving,
    submitError,
    submit,
  };
}
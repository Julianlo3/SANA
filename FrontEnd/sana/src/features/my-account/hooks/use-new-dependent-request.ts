"use client";

import { useCallback, useMemo, useState } from "react";
import { getDepartmentFromResidenceZone } from "@/config/residence-zones";
import { useConsultantAvailability } from "@/features/consultation-requests/hooks/use-consultant-availability";
import { submitConsultationRequest } from "@/features/consultation-requests/services/consultation-requests-service";
import { buildSlotDateTime } from "@/lib/date/slot-datetime";
import type {
  AppointmentMode,
  CardType,
  ConsultantAvailabilitySlot,
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
import { findDependentPackageForValuation } from "@/features/care-packages/lib/follow-up-valuation-eligibility";
import type { CarePackage } from "@/features/care-packages/types/care-package-types";
import { appointmentRequestErrorMessage } from "../lib/appointment-request-errors";
import type { OwnProfile } from "../types/my-account-types";

/**
 * Defines the card types.
 */
const CARD_TYPES = new Set(["CC", "TI", "CE"]);
/**
 * Defines the genders.
 */
const GENDERS = new Set(["F", "M", "O", "P"]);

/**
 * Defines the relationships.
 */
const RELATIONSHIPS: readonly {
  value: GuardianRelationshipId;
  label: string;
}[] = [
  { value: 1, label: "Madre" },
  { value: 2, label: "Padre" },
  { value: 3, label: "Tío/a" },
  { value: 4, label: "Abuelo/a" },
];

/**
 * Defines the dependent request values type.
 */
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
 * Manages dependent valuation data, availability, and submission.
 * @param profile Guardian profile used for requester fields.
 * @param onCreated Callback invoked after a successful request.
 * @param carePackages Packages used to route dependents to their existing package flow.
 * @returns Form state, slot availability, and request handlers.
 */
export function useNewDependentRequest(
  profile: OwnProfile,
  onCreated: () => void,
  carePackages: readonly CarePackage[] = [],
) {
  const availability = useConsultantAvailability();
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
  const [accepted, setAccepted] = useState(false);
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const [selectedSlot, setSelectedSlot] =
    useState<ConsultantAvailabilitySlot | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const missing = useMemo(() => getMissingProfileData(profile), [profile]);
  const matchingPackage = findDependentPackageForValuation(
    values.name,
    carePackages,
  );
  const packageRestrictionMessage =
    matchingPackage?.state === "activo"
      ? "Este dependiente tiene un paquete activo. Solicita sus sesiones desde «Mis paquetes»."
      : matchingPackage?.state === "finalizado"
        ? "La nueva valoración de este dependiente debe agendarse desde «Mis paquetes» con el psicólogo tratante."
        : null;
  const hasAvailableSelectedSlot = Boolean(
    selectedSlot &&
      !availability.isLoading &&
      !availability.error &&
      availability
        .slotsForDay(selectedSlot.date)
        .some((slot) => slot.startTime === selectedSlot.startTime),
  );
  const residenceDepartment = getDepartmentFromResidenceZone(
    profile.residenceZone,
  );
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
      appType: validateAppointmentMode(appType, residenceDepartment),
      reason: validateConsultationReason(reason),
      accepted: validateDataPolicy(accepted),
      appDate:
        wasSubmitted && !hasAvailableSelectedSlot
          ? "Selecciona un horario disponible para la valoración."
          : undefined,
    }),
    [
      values,
      appType,
      reason,
      accepted,
      residenceDepartment,
      wasSubmitted,
      hasAvailableSelectedSlot,
    ],
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
        accepted: undefined,
        appDate: undefined,
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
    if (packageRestrictionMessage) {
      setSubmitError(packageRestrictionMessage);
      return;
    }
    if (
      Object.values(errors).some(Boolean) ||
      !hasAvailableSelectedSlot ||
      !selectedSlot
    ) {
      return;
    }
    if (
      Date.parse(
        buildSlotDateTime(selectedSlot.date, selectedSlot.startTime),
      ) <= Date.now()
    ) {
      setSelectedSlot(null);
      return;
    }

    const payload: GuardianRequestPayload = {
      patientType: "dependent",
      requesterName: profile.fullName.trim(),
      requesterCardType: profile.cardType as CardType,
      requesterIdentityDocument: profile.identityDocument ?? "",
      requesterContactNumber: profile.phone?.trim() ?? "",
      requesterEmail: profile.email.trim().toLowerCase(),
      requesterBirthdate: profile.birthdate?.slice(0, 10) ?? "",
      requesterGender: profile.gender as Gender,
      requesterTermsAccepted: accepted,
      dependentName: values.name.trim(),
      dependentIdentityDocument: values.identityDocument.trim(),
      dependentBirthdate: values.birthdate,
      dependentGender: values.gender as Gender,
      dependentContactNumber: profile.phone?.trim() ?? "",
      relationshipId: values.relationship as GuardianRelationshipId,
      dependentTermsAccepted: accepted,
      appType: appType as AppointmentMode,
      appReason: reason.trim(),
      appDate: buildSlotDateTime(
        selectedSlot.date,
        selectedSlot.startTime,
      ),
      residenceZone: profile.residenceZone?.trim() || undefined,
    };

    setIsSaving(true);
    setSubmitError(null);

    try {
      await submitConsultationRequest(payload);
      onCreated();
    } catch (error: unknown) {
      setSubmitError(
        appointmentRequestErrorMessage(
          error,
          "No pudimos enviar tu solicitud. Intenta de nuevo en unos minutos.",
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    errors,
    packageRestrictionMessage,
    hasAvailableSelectedSlot,
    profile,
    values,
    appType,
    reason,
    accepted,
    selectedSlot,
    onCreated,
  ]);

  return {
    missing,
    values,
    setField,
    appType,
    setAppType,
    reason,
    setReason,
    accepted,
    setAccepted,
    errors: visibleErrors,
    residenceDepartment,
    availableDays: availability.availableDays,
    slotsForDay: availability.slotsForDay,
    isAvailabilityLoading: availability.isLoading,
    availabilityError: availability.error,
    reloadAvailability: availability.reload,
    selectedSlot,
    setSelectedSlot,
    isSaving,
    submitError,
    packageRestrictionMessage,
    submit,
    relationships: RELATIONSHIPS,
  };
}

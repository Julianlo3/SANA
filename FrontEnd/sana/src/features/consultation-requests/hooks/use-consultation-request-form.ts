"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@/hooks/use-form";
import { ApiError } from "@/types/api-types";
import { scrollToFirstError } from "../lib/scroll-to-first-error";
import { submitConsultationRequest } from "../services/consultation-requests-service";
import { buildSlotDateTime } from "@/lib/date/slot-datetime";
import type {
  AppointmentMode,
  CardType,
  ConsultantAvailabilitySlot,
  ConsultationRequestPayload,
  Gender,
  GuardianRelationshipId,
  PatientType,
} from "../types/consultation-request-types";
import {
  validateGuardianRequest,
  validateSelfRequest,
  type RequestFormErrors,
  type RequestFormValues,
} from "../validation/consultation-request-validation";

/**
 * Initial values shared by self and guardian request forms.
 */
const EMPTY_FORM: RequestFormValues = {
  fullName: "",
  documentType: "",
  identityDocument: "",
  confirmIdentityDocument: "",
  birthDate: "",
  gender: "",
  email: "",
  confirmEmail: "",
  phone: "",
  appType: "",
  relationship: "",
  minorFullName: "",
  minorBirthDate: "",
  minorGender: "",
  minorIdentityDocument: "",
  confirmMinorIdentityDocument: "",
  department: "",
  municipality: "",
  consultationReason: "",
  hasAcceptedDataPolicy: false,
  hasAcceptedGuardianDataPolicy: false,
  hasAcceptedMinorDataPolicy: false,
  appDate: "",
};

/**
 * Display labels used in the validation error summary.
 */
const FIELD_LABELS: Record<keyof RequestFormValues, string> = {
  fullName: "Nombre completo",
  documentType: "Tipo de documento",
  identityDocument: "Número de documento",
  confirmIdentityDocument: "Confirmación del documento",
  birthDate: "Fecha de nacimiento",
  gender: "Género",
  email: "Correo",
  confirmEmail: "Confirmación del correo",
  phone: "Teléfono",
  appType: "Modalidad de la cita",
  relationship: "Parentesco",
  minorFullName: "Nombre del menor",
  minorBirthDate: "Fecha de nacimiento del menor",
  minorGender: "Género del menor",
  minorIdentityDocument: "Documento del menor",
  confirmMinorIdentityDocument: "Confirmación del documento del menor",
  department: "Departamento",
  municipality: "Municipio",
  consultationReason: "Motivo de la consulta",
  hasAcceptedDataPolicy: "Autorización de datos",
  hasAcceptedGuardianDataPolicy: "Autorización de datos del acudiente",
  hasAcceptedMinorDataPolicy: "Autorización de datos del menor",
  appDate: "Horario de la cita de evaluación",
};

/**
 * Maps backend DTO property names to frontend form fields.
 */
const BACKEND_FIELDS: Record<string, keyof RequestFormValues> = {
  requesterName: "fullName",
  requesterCardType: "documentType",
  requesterIdentityDocument: "identityDocument",
  requesterContactNumber: "phone",
  requesterEmail: "email",
  requesterBirthdate: "birthDate",
  requesterGender: "gender",
  dependentName: "minorFullName",
  dependentIdentityDocument: "minorIdentityDocument",
  dependentBirthdate: "minorBirthDate",
  dependentGender: "minorGender",
  relationshipId: "relationship",
  appType: "appType",
  appReason: "consultationReason",
  residenceZone: "municipality",
  appDate: "appDate",
};

/**
 * Maps backend validation codes to the related form field.
 */
const ERROR_CODE_FIELDS: Record<string, keyof RequestFormValues> = {
  REQUESTER_BIRTHDATE_REQUIRED: "birthDate",
  REQUESTER_MUST_BE_ADULT: "birthDate",
  DEPENDENT_MUST_BE_MINOR: "minorBirthDate",
  DEPENDENT_RELATIONSHIP_REQUIRED: "relationship",
  INVALID_RELATIONSHIP: "relationship",
};

/**
 * Backend error code for an already registered requester.
 */
const ALREADY_REGISTERED_CODE = "REQUESTER_ALREADY_REGISTERED";

/**
 * User-facing message for an already registered requester.
 */
const ALREADY_REGISTERED_MESSAGE =
  "No pudimos asociar la solicitud con esos datos. Verifica tu correo y documento, o inicia sesión si ya tienes una cuenta.";

/**
 * User-facing fallback for unexpected backend failures.
 */
const SERVER_ERROR_MESSAGE =
  "No pudimos registrar tu solicitud. Si ya pediste una cita antes con estos datos, entra por Ingresar → Consultantes. Si el problema continúa, intenta más tarde o comunícate con la fundación.";

/**
 * Maps backend validation errors to frontend form fields.
 * @param error API error containing field errors or a validation code.
 * @returns Validation errors keyed by frontend form field.
 */
function mapServerErrors(error: ApiError): RequestFormErrors {
  const mapped: RequestFormErrors = {};

  for (const [property, message] of Object.entries(error.fieldErrors)) {
    const field = BACKEND_FIELDS[property];
    if (field) mapped[field] = message;
  }

  const codeField = error.code ? ERROR_CODE_FIELDS[error.code] : undefined;
  if (codeField) mapped[codeField] = error.message;

  return mapped;
}

/**
 * Combines department and municipality into the API residence field.
 * @param department Selected department.
 * @param municipality Selected municipality.
 * @returns Residence in "Municipality, Department" format, or undefined.
 */
function buildResidenceZone(
  department: string,
  municipality: string,
): string | undefined {
  if (!department || !municipality.trim()) return undefined;
  return `${municipality.trim()}, ${department}`;
}

/**
 * Manages validation, selection, and submission for public request forms.
 * @param patientType Request type, either self or dependent.
 * @returns Form state, field handlers, selected slot, and submit action.
 */
export function useConsultationRequestForm(patientType: PatientType) {
  const router = useRouter();

  const form = useForm<RequestFormValues>({
    initialValues: EMPTY_FORM,
    validate:
      patientType === "dependent" ? validateGuardianRequest : validateSelfRequest,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<RequestFormErrors>({});

  const { setValue: baseSetValue, submit } = form;

  /**
   * Updates a field and clears its previous backend validation error.
   * @param field Field to update.
   * @param value New field value.
   * @returns Nothing.
   */
  const setValue = useCallback(
    <K extends keyof RequestFormValues>(
      field: K,
      value: RequestFormValues[K],
    ) => {
      setServerErrors((current) => {
        if (!current[field]) return current;
        const next = { ...current };
        delete next[field];
        return next;
      });
      baseSetValue(field, value);
    },
    [baseSetValue],
  );

  const errors = useMemo<RequestFormErrors>(
    () => ({ ...form.errors, ...serverErrors }),
    [form.errors, serverErrors],
  );

  const showSummary =
    form.wasSubmitted || Object.keys(serverErrors).length > 0;

  /**
   * Builds the visible labels for the current validation summary.
   * @returns Invalid field labels, or an empty array when hidden.
   */
  const errorSummary = useMemo(
    () =>
      showSummary
        ? (Object.keys(errors) as (keyof RequestFormValues)[]).map(
          (key) => FIELD_LABELS[key],
        )
        : [],
    [errors, showSummary],
  );

  /**
   * Updates the selected guardian relationship.
   * @param relationship Relationship identifier or empty value.
   * @returns Nothing.
   */
  const setRelationship = useCallback(
    (relationship: GuardianRelationshipId | "") => {
      setValue("relationship", relationship);
    },
    [setValue],
  );

  /**
   * Updates the selected identity document type.
   * @param documentType Document type or empty value.
   * @returns Nothing.
   */
  const setDocumentType = useCallback(
    (documentType: CardType | "") => {
      setValue("documentType", documentType);
    },
    [setValue],
  );

  /**
   * Updates the requester's gender.
   * @param gender Gender code or empty value.
   * @returns Nothing.
   */
  const setGender = useCallback(
    (gender: Gender | "") => {
      setValue("gender", gender);
    },
    [setValue],
  );

  /**
   * Updates the dependent's gender.
   * @param gender Gender code or empty value.
   * @returns Nothing.
   */
  const setMinorGender = useCallback(
    (gender: Gender | "") => {
      setValue("minorGender", gender);
    },
    [setValue],
  );

  /**
   * Updates the appointment delivery mode.
   * @param appType Appointment mode or empty value.
   * @returns Nothing.
   */
  const setAppointmentMode = useCallback(
    (appType: AppointmentMode | "") => {
      setValue("appType", appType);
    },
    [setValue],
  );

  /**
   * Updates requester data processing consent.
   * @param accepted Whether consent was accepted.
   * @returns Nothing.
   */
  const toggleDataPolicy = useCallback(
    (accepted: boolean) => {
      setValue("hasAcceptedDataPolicy", accepted);
    },
    [setValue],
  );

  /**
   * Updates guardian data processing consent.
   * @param accepted Whether consent was accepted.
   * @returns Nothing.
   */
  const toggleGuardianDataPolicy = useCallback(
    (accepted: boolean) => {
      setValue("hasAcceptedGuardianDataPolicy", accepted);
    },
    [setValue],
  );

  /**
   * Updates dependent data processing consent.
   * @param accepted Whether consent was accepted.
   * @returns Nothing.
   */
  const toggleMinorDataPolicy = useCallback(
    (accepted: boolean) => {
      setValue("hasAcceptedMinorDataPolicy", accepted);
    },
    [setValue],
  );

  /**
   * Currently selected evaluation appointment slot.
   */
  const [selectedSlot, setSelectedSlot] =
    useState<ConsultantAvailabilitySlot | null>(null);

  /**
   * Stores the selected slot and updates the form's appointment datetime.
   * @param slot Selected availability slot, or null to clear it.
   * @returns Nothing.
   */
  const selectSlot = useCallback(
    (slot: ConsultantAvailabilitySlot | null) => {
      setSelectedSlot(slot);
      if (slot) {
        setValue("appDate", buildSlotDateTime(slot.date, slot.startTime));
      } else {
        setValue("appDate", "");
      }
    },
    [setValue],
  );

  /**
   * Builds the API payload for the active request type.
   * @param submitted Validated form values.
   * @returns The self or dependent request payload.
   */
  const buildPayload = useCallback(
    (submitted: RequestFormValues): ConsultationRequestPayload => {
      const residenceZone = buildResidenceZone(
        submitted.department,
        submitted.municipality,
      );

      if (patientType === "dependent") {
        return {
          patientType: "dependent",
          requesterName: submitted.fullName.trim(),
          requesterCardType: submitted.documentType as CardType,
          requesterIdentityDocument: submitted.identityDocument.trim(),
          requesterContactNumber: submitted.phone.trim(),
          requesterEmail: submitted.email.trim().toLowerCase(),
          requesterBirthdate: submitted.birthDate,
          requesterGender: submitted.gender as Gender,
          requesterTermsAccepted: true,
          dependentName: submitted.minorFullName.trim(),
          dependentIdentityDocument: submitted.minorIdentityDocument.trim(),
          dependentBirthdate: submitted.minorBirthDate,
          dependentGender: submitted.minorGender as Gender,
          dependentContactNumber: submitted.phone.trim(),
          relationshipId: submitted.relationship as GuardianRelationshipId,
          dependentTermsAccepted: true,
          appType: submitted.appType as AppointmentMode,
          appReason: submitted.consultationReason.trim(),
          appDate: submitted.appDate,
          residenceZone,
        };
      }

      return {
        patientType: "self",
        requesterName: submitted.fullName.trim(),
        requesterCardType: submitted.documentType as CardType,
        requesterIdentityDocument: submitted.identityDocument.trim(),
        requesterContactNumber: submitted.phone.trim(),
        requesterEmail: submitted.email.trim().toLowerCase(),
        requesterBirthdate: submitted.birthDate,
        requesterGender: submitted.gender as Gender,
        requesterTermsAccepted: true,
        appType: submitted.appType as AppointmentMode,
        appReason: submitted.consultationReason.trim(),
        appDate: submitted.appDate,
        residenceZone,
      };
    },
    [patientType],
  );

  /**
   * Submits the request and identifies fields rejected by the backend.
   * @returns Rejected form fields, or an empty array when none are identified.
   */
  const send = useCallback(async (): Promise<
    (keyof RequestFormValues)[]
  > => {
    const submitted = submit();

    if (!submitted) {
      window.setTimeout(scrollToFirstError, 50);
      return [];
    }

    setIsSaving(true);
    setSubmitError(null);
    setServerErrors({});

    try {
      const result = await submitConsultationRequest(buildPayload(submitted));

      const params = new URLSearchParams({
        radicado: String(result.appId),
      });

      router.push(`/solicitar-cita/confirmacion?${params.toString()}`);
      return [];
    } catch (error: unknown) {
      if (!(error instanceof ApiError)) {
        setSubmitError(
          "No pudimos enviar tu solicitud. Intenta de nuevo en unos minutos.",
        );
        return [];
      }

      const mapped = mapServerErrors(error);
      const fields = Object.keys(mapped) as (keyof RequestFormValues)[];

      if (fields.length > 0) {
        setServerErrors(mapped);
        window.setTimeout(scrollToFirstError, 50);
      } else if (error.code === ALREADY_REGISTERED_CODE) {
        setSubmitError(ALREADY_REGISTERED_MESSAGE);
      } else if (error.status >= 500) {
        setSubmitError(SERVER_ERROR_MESSAGE);
      } else {
        setSubmitError(error.message);
      }

      return fields;
    } finally {
      setIsSaving(false);
    }
  }, [submit, buildPayload, router]);

  return {
    ...form,
    errors,
    errorSummary,
    setValue,
    setRelationship,
    setDocumentType,
    setGender,
    setMinorGender,
    setAppointmentMode,
    toggleDataPolicy,
    toggleGuardianDataPolicy,
    toggleMinorDataPolicy,
    selectedSlot,
    setSelectedSlot: selectSlot,
    isSaving,
    submitError,
    send,
  };
}
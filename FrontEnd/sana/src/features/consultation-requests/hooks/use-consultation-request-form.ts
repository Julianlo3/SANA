"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@/hooks/use-form";
import { ApiError } from "@/types/api-types";
import { submitConsultationRequest } from "../services/consultation-requests-service";
import type {
  AppointmentMode,
  CardType,
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
};

/** Nombre de cada campo, para decirle a la persona cuáles tiene mal. */
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
};

/** Campo del backend (DTO) → campo del formulario. */
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
};

/** Error de negocio del backend → campo del formulario donde se muestra. */
const ERROR_CODE_FIELDS: Record<string, keyof RequestFormValues> = {
  REQUESTER_BIRTHDATE_REQUIRED: "birthDate",
  REQUESTER_MUST_BE_ADULT: "birthDate",
  DEPENDENT_MUST_BE_MINOR: "minorBirthDate",
  DEPENDENT_RELATIONSHIP_REQUIRED: "relationship",
  INVALID_RELATIONSHIP: "relationship",
};

/**
 * Código que el backend enviará cuando el documento o el correo ya estén
 * registrados. Hoy no existe: queda listo para cuando lo agreguen.
 */
const ALREADY_REGISTERED_CODE = "REQUESTER_ALREADY_REGISTERED";
const ALREADY_REGISTERED_MESSAGE =
  "Estos datos ya están registrados. Si ya pediste una cita antes, entra con tu cuenta en Ingresar → Consultantes.";

/** Pasa los errores del backend a los campos del formulario. */
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

/** Lleva la pantalla al primer campo con error y le da el foco. */
function scrollToFirstError() {
  const target = document.querySelector<HTMLElement>(
    '[aria-invalid="true"], [role="alert"]',
  );
  if (!target) return;

  target.scrollIntoView({ behavior: "smooth", block: "center" });

  const field = target
    .closest("label, div")
    ?.querySelector<HTMLElement>("input, select, textarea");
  field?.focus({ preventScroll: true });
}

/**
 * El backend guarda la residencia como un solo texto (residenceZone),
 * hasta 255 caracteres, opcional. Se arma como "Municipio, Departamento".
 * Si la persona no indicó nada, se manda undefined (el campo es opcional).
 */
function buildResidenceZone(
  department: string,
  municipality: string,
): string | undefined {
  if (!department || !municipality.trim()) return undefined;
  return `${municipality.trim()}, ${department}`;
}

/**
 * Lógica del formulario público de solicitud (HU-2.2).
 *
 * Un solo hook cubre los dos tipos de solicitante porque comparten la mayoría
 * de los campos. Eso permite conservar los datos de contacto al cambiar de
 * tipo, como pide HU-2.2.9.
 *
 * Alineado al DTO real del backend (CreateAppointmentDto): el payload es
 * plano, no anidado en guardian/minor, y el género va en una letra.
 *
 * Departamento y municipio se combinan en un solo texto (residenceZone),
 * porque el backend los guarda así, no como dos campos separados.
 *
 * Pedido del cliente (reunión 30/09): se quitó la fecha preferida de cita
 * del formulario. appDateIdeal ya no se pide a la persona; se manda null
 * siempre, y la pantalla muestra un mensaje fijo de que la asistente
 * asignará la cita en el menor tiempo posible.
 *
 * Errores: se muestran debajo de cada campo y en un resumen que dice cuáles
 * están mal. Si el backend rechaza un campo que la validación local no
 * detectó, también queda marcado en ese campo.
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

  /** Al editar un campo, se quita el error que le había puesto el backend. */
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

  /** Nombres de los campos que están mal, para el resumen. */
  const errorSummary = useMemo(
    () =>
      showSummary
        ? (Object.keys(errors) as (keyof RequestFormValues)[]).map(
            (key) => FIELD_LABELS[key],
          )
        : [],
    [errors, showSummary],
  );

  const setRelationship = useCallback(
    (relationship: GuardianRelationshipId | "") => {
      setValue("relationship", relationship);
    },
    [setValue],
  );

  const setDocumentType = useCallback(
    (documentType: CardType | "") => {
      setValue("documentType", documentType);
    },
    [setValue],
  );

  const setGender = useCallback(
    (gender: Gender | "") => {
      setValue("gender", gender);
    },
    [setValue],
  );

  const setMinorGender = useCallback(
    (gender: Gender | "") => {
      setValue("minorGender", gender);
    },
    [setValue],
  );

  const setAppointmentMode = useCallback(
    (appType: AppointmentMode | "") => {
      setValue("appType", appType);
    },
    [setValue],
  );

  const toggleDataPolicy = useCallback(
    (accepted: boolean) => {
      setValue("hasAcceptedDataPolicy", accepted);
    },
    [setValue],
  );

  const toggleGuardianDataPolicy = useCallback(
    (accepted: boolean) => {
      setValue("hasAcceptedGuardianDataPolicy", accepted);
    },
    [setValue],
  );

  const toggleMinorDataPolicy = useCallback(
    (accepted: boolean) => {
      setValue("hasAcceptedMinorDataPolicy", accepted);
    },
    [setValue],
  );

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
          appDateIdeal: null,
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
        appDateIdeal: null,
        residenceZone,
      };
    },
    [patientType],
  );

  const send = useCallback(async () => {
    const submitted = submit();

    if (!submitted) {
      window.setTimeout(scrollToFirstError, 50);
      return;
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
    } catch (error: unknown) {
      if (!(error instanceof ApiError)) {
        setSubmitError(
          "No pudimos enviar tu solicitud. Intenta de nuevo en unos minutos.",
        );
      } else {
        const mapped = mapServerErrors(error);

        if (Object.keys(mapped).length > 0) {
          setServerErrors(mapped);
          window.setTimeout(scrollToFirstError, 50);
        } else if (error.code === ALREADY_REGISTERED_CODE) {
          setSubmitError(ALREADY_REGISTERED_MESSAGE);
        } else {
          setSubmitError(error.message);
        }
      }
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
    isSaving,
    submitError,
    send,
  };
}
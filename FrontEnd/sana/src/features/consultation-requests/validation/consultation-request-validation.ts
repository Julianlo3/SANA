import type { CardType, Gender } from "../types/consultation-request-types";
import type { VulnerablePopulationCategory } from "@/config/vulnerable-population";
import { allowsInPersonAppointments } from "@/config/residence-zones";

/**
 * Validation rules and types for public consultation request forms.
 */
/** Regular expression for validating email addresses. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Regular expression for values containing decimal digits only. */
const ONLY_DIGITS = /^\d+$/;
/** Regular expression for supported personal names. */
const NAME_PATTERN = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;

/** Minimum accepted identity document length. */
const IDENTITY_DOCUMENT_MIN_LENGTH = 6;
/** Maximum accepted identity document length. */
const IDENTITY_DOCUMENT_MAX_LENGTH = 12;
/** Minimum accepted phone number length. */
const PHONE_MIN_LENGTH = 7;
/** Maximum accepted phone number length. */
const PHONE_MAX_LENGTH = 12;
/** Maximum consultation reason length. */
const REASON_MAX_LENGTH = 1000;

/**
 * Minimum age for a dependent identity card.
 */
export const IDENTITY_CARD_MIN_AGE = 7;

/**
 * Values collected by both self and guardian request forms.
 */
export type RequestFormValues = {
  fullName: string;
  documentType: CardType | "";
  identityDocument: string;
  confirmIdentityDocument: string;
  birthDate: string;
  gender: Gender | "";
  email: string;
  confirmEmail: string;
  phone: string;
  appType: "presencial" | "virtual" | "";
  relationship: number | "";
  minorFullName: string;
  minorBirthDate: string;
  minorGender: Gender | "";
  minorIdentityDocument: string;
  confirmMinorIdentityDocument: string;
  department: string;
  municipality: string;
  consultationReason: string;
  /** Optional sensitive answer; only the self request sends it. */
  vulnerablePopulation: VulnerablePopulationCategory | "";
  hasAcceptedDataPolicy: boolean;
  hasAcceptedGuardianDataPolicy: boolean;
  hasAcceptedMinorDataPolicy: boolean;
  /** Selected evaluation slot as an ISO datetime. */
  appDate: string;
};

/**
 * Validation errors keyed by request form field.
 */
export type RequestFormErrors = Partial<Record<keyof RequestFormValues, string>>;

/**
 * Validates a full name against required length and supported characters.
 * @param value Name value to validate.
 * @returns A validation message, or undefined when valid.
 */
export function validateFullName(value: string): string | undefined {
  const name = value.trim();

  if (!name) return "Escribe el nombre completo.";
  if (name.length < 3) return "El nombre debe tener al menos 3 letras.";
  if (name.length > 100) return "El nombre no puede pasar de 100 caracteres.";
  if (!NAME_PATTERN.test(name)) {
    return "El nombre solo admite letras, espacios, guiones y apóstrofes.";
  }

  return undefined;
}

/**
 * Validates that a document type has been selected.
 * @param value Selected document type.
 * @returns A validation message, or undefined when valid.
 */
export function validateDocumentType(value: string): string | undefined {
  if (!value) return "Selecciona el tipo de documento.";
  return undefined;
}

/**
 * Validates the requester's identity document.
 * @param value Document number to validate.
 * @returns A validation message, or undefined when valid.
 */
export function validateIdentityDocument(value: string): string | undefined {
  const document = value.trim();

  if (!document) return "Escribe el número de documento.";
  if (!ONLY_DIGITS.test(document)) {
    return "El documento solo admite números, sin puntos ni guiones.";
  }
  if (
    document.length < IDENTITY_DOCUMENT_MIN_LENGTH ||
    document.length > IDENTITY_DOCUMENT_MAX_LENGTH
  ) {
    return `El documento debe tener entre ${IDENTITY_DOCUMENT_MIN_LENGTH} y ${IDENTITY_DOCUMENT_MAX_LENGTH} dígitos.`;
  }

  return undefined;
}

/**
 * Validates confirm identity document.
 * @param document document input.
 * @param confirmDocument confirm document input.
 * @returns Formatted value or validation message.
 */

export function validateConfirmIdentityDocument(
  document: string,
  confirmDocument: string,
): string | undefined {
  if (!confirmDocument.trim()) return "Confirma el número de documento.";
  if (document.trim() !== confirmDocument.trim()) {
    return "Los documentos no coinciden.";
  }

  return undefined;
}

/**
 * Validates the dependent's required identity document.
 * @param value Document number to validate.
 * @returns A validation message, or undefined when valid.
 */
export function validateMinorIdentityDocument(
  value: string,
): string | undefined {
  const document = value.trim();

  if (!document) return "Escribe el número de documento del menor.";
  if (!ONLY_DIGITS.test(document)) {
    return "El documento solo admite números, sin puntos ni guiones.";
  }
  if (
    document.length < IDENTITY_DOCUMENT_MIN_LENGTH ||
    document.length > IDENTITY_DOCUMENT_MAX_LENGTH
  ) {
    return `El documento debe tener entre ${IDENTITY_DOCUMENT_MIN_LENGTH} y ${IDENTITY_DOCUMENT_MAX_LENGTH} dígitos.`;
  }

  return undefined;
}

/**
 * Validates confirm minor identity document.
 * @param document document input.
 * @param confirmDocument confirm document input.
 * @returns Formatted value or validation message.
 */

export function validateConfirmMinorIdentityDocument(
  document: string,
  confirmDocument: string,
): string | undefined {
  if (!confirmDocument.trim()) return "Confirma el documento del menor.";
  if (document.trim() !== confirmDocument.trim()) {
    return "Los documentos del menor no coinciden.";
  }

  return undefined;
}

/**
 * Validates an email address.
 * @param value Email address to validate.
 * @returns A validation message, or undefined when valid.
 */
export function validateEmail(value: string): string | undefined {
  const email = value.trim();

  if (!email) return "Escribe tu correo electrónico.";
  if (!EMAIL_PATTERN.test(email)) {
    return "Escribe un correo válido, por ejemplo nombre@correo.com.";
  }

  return undefined;
}

/**
 * Validates confirm email.
 * @param email email input.
 * @param confirmEmail confirm email input.
 * @returns Formatted value or validation message.
 */

export function validateConfirmEmail(
  email: string,
  confirmEmail: string,
): string | undefined {
  if (!confirmEmail.trim()) return "Confirma tu correo electrónico.";
  if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
    return "Los correos no coinciden.";
  }

  return undefined;
}

/**
 * Validates a phone number's required value, digits, and length.
 * @param value Phone number to validate.
 * @returns A validation message, or undefined when valid.
 */
export function validatePhone(value: string): string | undefined {
  const phone = value.trim();

  if (!phone) return "Escribe tu número de teléfono.";
  if (!ONLY_DIGITS.test(phone)) {
    return "El número solo admite dígitos, sin espacios ni guiones.";
  }
  if (phone.length < PHONE_MIN_LENGTH || phone.length > PHONE_MAX_LENGTH) {
    return `El número debe tener entre ${PHONE_MIN_LENGTH} y ${PHONE_MAX_LENGTH} dígitos.`;
  }

  return undefined;
}

/**
 * Validates a birth date and ensures it is not in the future.
 * @param value Date string to validate.
 * @param label Field label used in the required-value message.
 * @returns A validation message, or undefined when valid.
 */
export function validateBirthDate(
  value: string,
  label = "tu fecha de nacimiento",
): string | undefined {
  if (!value) return `Selecciona ${label}.`;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "La fecha no es válida.";
  if (date > new Date()) return "La fecha no puede ser futura.";

  return undefined;
}

/**
 * Validates that the dependent is younger than 18.
 * @param value Dependent birth date.
 * @returns A validation message, or undefined when valid.
 */
export function validateMinorBirthDate(value: string): string | undefined {
  const dateError = validateBirthDate(value, "la fecha de nacimiento del menor");
  if (dateError) return dateError;

  if (calculateAge(value) >= 18) {
    return "La persona ya es mayor de edad. Vuelve al inicio y elige “Solicito para mí”.";
  }

  return undefined;
}

/**
 * Validates that the requester or guardian is at least 18 years old.
 * @param value Requester birth date.
 * @returns A validation message, or undefined when valid.
 */
export function validateAdultBirthDate(value: string): string | undefined {
  const dateError = validateBirthDate(value);
  if (dateError) return dateError;

  if (calculateAge(value) < 18) {
    return "Debes ser mayor de edad para solicitar la cita.";
  }

  return undefined;
}

/**
 * Validates that a gender value has been selected.
 * @param value Selected gender code.
 * @returns A validation message, or undefined when valid.
 */
export function validateGender(value: string): string | undefined {
  if (!value) return "Selecciona el género.";
  return undefined;
}

/**
 * Validates that the selected appointment mode is allowed for the department.
 * @param value Selected appointment mode.
 * @param department Selected department.
 * @returns A validation message, or undefined when valid.
 */
export function validateAppointmentMode(
  value: string,
  department?: string,
): string | undefined {
  if (!value) return "Selecciona si la cita es presencial o virtual.";
  if (
    value === "presencial" &&
    department !== undefined &&
    !allowsInPersonAppointments(department)
  ) {
    return "La atención presencial solo está disponible para residentes del departamento del Huila.";
  }
  return undefined;
}

/**
 * Validates that a guardian relationship has been selected.
 * @param value Selected relationship identifier.
 * @returns A validation message, or undefined when valid.
 */
export function validateRelationship(value: number | ""): string | undefined {
  if (!value) return "Selecciona tu parentesco con el menor.";
  return undefined;
}

/**
 * Validates municipality selection when a department is provided.
 * @param department Selected department.
 * @param municipality Selected municipality.
 * @returns A validation message, or undefined when valid.
 */
export function validateMunicipality(
  department: string,
  municipality: string,
): string | undefined {
  if (department && !municipality.trim()) {
    return "Selecciona el municipio, o deja el departamento sin seleccionar.";
  }

  return undefined;
}

/**
 * Validates the consultation reason length.
 * @param value Consultation reason.
 * @returns A validation message, or undefined when valid.
 */
export function validateConsultationReason(value: string): string | undefined {
  if (value.length > REASON_MAX_LENGTH) {
    return `El motivo no puede pasar de ${REASON_MAX_LENGTH} caracteres.`;
  }

  return undefined;
}

/**
 * Validates that an evaluation appointment slot has been selected.
 * @param value Selected slot as an ISO datetime.
 * @returns A validation message, or undefined when valid.
 */
export function validateEvaluationSlot(value: string): string | undefined {
  if (!value?.trim()) {
    return "Selecciona un horario disponible para tu cita de evaluación.";
  }
  return undefined;
}

/**
 * Validates required data processing consent.
 * @param accepted Whether consent was accepted.
 * @returns A validation message, or undefined when valid.
 */
export function validateDataPolicy(accepted: boolean): string | undefined {
  if (!accepted) return "Debes autorizar el tratamiento de datos para continuar.";
  return undefined;
}

/**
 * Validates all fields required for a self request.
 * @param values Current request form values.
 * @returns Validation errors keyed by field.
 */
export function validateSelfRequest(values: RequestFormValues): RequestFormErrors {
  return removeEmptyErrors({
    fullName: validateFullName(values.fullName),
    documentType: validateDocumentType(values.documentType),
    identityDocument: validateIdentityDocument(values.identityDocument),
    confirmIdentityDocument: validateConfirmIdentityDocument(
      values.identityDocument,
      values.confirmIdentityDocument,
    ),
    birthDate: validateAdultBirthDate(values.birthDate),
    gender: validateGender(values.gender),
    email: validateEmail(values.email),
    confirmEmail: validateConfirmEmail(values.email, values.confirmEmail),
    phone: validatePhone(values.phone),
    appType: validateAppointmentMode(values.appType, values.department),
    municipality: validateMunicipality(values.department, values.municipality),
    consultationReason: validateConsultationReason(values.consultationReason),
    appDate: validateEvaluationSlot(values.appDate),
    hasAcceptedDataPolicy: validateDataPolicy(values.hasAcceptedDataPolicy),
  });
}

/**
 * Validates all fields required for a guardian request.
 * @param values Current request form values.
 * @returns Validation errors keyed by field.
 */
export function validateGuardianRequest(values: RequestFormValues): RequestFormErrors {
  return removeEmptyErrors({
    fullName: validateFullName(values.fullName),
    identityDocument: validateIdentityDocument(values.identityDocument),
    confirmIdentityDocument: validateConfirmIdentityDocument(
      values.identityDocument,
      values.confirmIdentityDocument,
    ),
    birthDate: validateAdultBirthDate(values.birthDate),
    relationship: validateRelationship(values.relationship),
    email: validateEmail(values.email),
    confirmEmail: validateConfirmEmail(values.email, values.confirmEmail),
    phone: validatePhone(values.phone),
    appType: validateAppointmentMode(values.appType, values.department),

    minorFullName: validateFullName(values.minorFullName),
    minorBirthDate: validateMinorBirthDate(values.minorBirthDate),
    minorGender: validateGender(values.minorGender),
    minorIdentityDocument: validateMinorIdentityDocument(
      values.minorIdentityDocument,
    ),
    confirmMinorIdentityDocument: validateConfirmMinorIdentityDocument(
      values.minorIdentityDocument,
      values.confirmMinorIdentityDocument,
    ),

    municipality: validateMunicipality(values.department, values.municipality),
    consultationReason: validateConsultationReason(values.consultationReason),
    appDate: validateEvaluationSlot(values.appDate),

    hasAcceptedGuardianDataPolicy: validateDataPolicy(
      values.hasAcceptedGuardianDataPolicy,
    ),
    hasAcceptedMinorDataPolicy: validateDataPolicy(
      values.hasAcceptedMinorDataPolicy,
    ),
  });
}

/**
 * Calculates age in full years from a birth date.
 * @param birthDate Birth date string.
 * @returns Age in years.
 */
export function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age;
}

/**
 * Removes fields without validation messages.
 * @param errors Validation errors to filter.
 * @returns Errors containing only non-empty messages.
 */
function removeEmptyErrors(errors: RequestFormErrors): RequestFormErrors {
  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => Boolean(message)),
  ) as RequestFormErrors;
}
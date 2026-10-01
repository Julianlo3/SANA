import type { CardType, Gender } from "../types/consultation-request-types";

/**
 * Reglas de validación del formulario público de solicitud (HU-2.2).
 *
 * Alineadas al backend real (BackEnd/backendsana/src/appointments/dto/create-appointment.dto.ts):
 * documento entre 6 y 12 dígitos, teléfono entre 7 y 12, tres tipos de
 * documento posibles (CC, TI, CE). El menor de edad sí necesita documento
 * (NUIP o TI, según su edad): el backend lo exige siempre, no es opcional.
 *
 * Pedido del cliente (reunión 30/09): confirmar dos veces el documento y
 * el correo, para evitar errores de tipeo en el contacto de la persona.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ONLY_DIGITS = /^\d+$/;
const NAME_PATTERN = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;

const IDENTITY_DOCUMENT_MIN_LENGTH = 6;
const IDENTITY_DOCUMENT_MAX_LENGTH = 12;
const PHONE_MIN_LENGTH = 7;
const PHONE_MAX_LENGTH = 12;
const REASON_MAX_LENGTH = 1000;

/** Edad en la que la Registraduría expide la tarjeta de identidad. Antes de eso, el documento es el registro civil (NUIP). */
export const IDENTITY_CARD_MIN_AGE = 7;

/** Valores del formulario, comunes a los dos tipos de solicitante. */
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
  hasAcceptedDataPolicy: boolean;
  hasAcceptedGuardianDataPolicy: boolean;
  hasAcceptedMinorDataPolicy: boolean;
};

export type RequestFormErrors = Partial<Record<keyof RequestFormValues, string>>;

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

export function validateDocumentType(value: string): string | undefined {
  if (!value) return "Selecciona el tipo de documento.";
  return undefined;
}

/** Documento del adulto solicitante (o del acudiente). Siempre obligatorio. */
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

/** Confirma que el documento escrito dos veces coincida. */
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
 * Documento del menor: el backend lo exige siempre. Antes de los 7 años es
 * el número del registro civil de nacimiento (NUIP); desde los 7, la
 * tarjeta de identidad. Es el mismo campo, la etiqueta cambia con la edad.
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

/** Confirma que el documento del menor escrito dos veces coincida. */
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

export function validateEmail(value: string): string | undefined {
  const email = value.trim();

  if (!email) return "Escribe tu correo electrónico.";
  if (!EMAIL_PATTERN.test(email)) {
    return "Escribe un correo válido, por ejemplo nombre@correo.com.";
  }

  return undefined;
}

/** Confirma que el correo escrito dos veces coincida. */
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

/** El menor debe tener menos de 18 años. */
export function validateMinorBirthDate(value: string): string | undefined {
  const dateError = validateBirthDate(value, "la fecha de nacimiento del menor");
  if (dateError) return dateError;

  if (calculateAge(value) >= 18) {
    return "La persona ya es mayor de edad. Vuelve al inicio y elige “Solicito para mí”.";
  }

  return undefined;
}

/**
 * El backend exige que el solicitante o acudiente sea mayor de edad
 * (REQUESTER_MUST_BE_ADULT). Aplica tanto al formulario propio como al del
 * acudiente.
 */
export function validateAdultBirthDate(value: string): string | undefined {
  const dateError = validateBirthDate(value);
  if (dateError) return dateError;

  if (calculateAge(value) < 18) {
    return "Debes ser mayor de edad para solicitar la cita.";
  }

  return undefined;
}

export function validateGender(value: string): string | undefined {
  if (!value) return "Selecciona el género.";
  return undefined;
}

/** Modalidad de la cita: el backend la exige siempre. */
export function validateAppointmentMode(value: string): string | undefined {
  if (!value) return "Selecciona si la cita es presencial o virtual.";
  return undefined;
}

export function validateRelationship(value: number | ""): string | undefined {
  if (!value) return "Selecciona tu parentesco con el menor.";
  return undefined;
}

export function validateMunicipality(
  department: string,
  municipality: string,
): string | undefined {
  if (department && !municipality.trim()) {
    return "Escribe el municipio, o deja el departamento sin seleccionar.";
  }

  return undefined;
}

export function validateConsultationReason(value: string): string | undefined {
  if (value.length > REASON_MAX_LENGTH) {
    return `El motivo no puede pasar de ${REASON_MAX_LENGTH} caracteres.`;
  }

  return undefined;
}

/** HU-2.2.6: sin la autorización no se puede enviar la solicitud. */
export function validateDataPolicy(accepted: boolean): string | undefined {
  if (!accepted) return "Debes autorizar el tratamiento de datos para continuar.";
  return undefined;
}

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
    appType: validateAppointmentMode(values.appType),
    municipality: validateMunicipality(values.department, values.municipality),
    consultationReason: validateConsultationReason(values.consultationReason),
    hasAcceptedDataPolicy: validateDataPolicy(values.hasAcceptedDataPolicy),
  });
}

/**
 * Valida el formulario del tutor legal.
 *
 * No se valida documentType del tutor: ese formulario solo pide el número,
 * sin tipo. Sí se valida su fecha de nacimiento, porque el backend exige
 * que el acudiente sea mayor de edad.
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
    appType: validateAppointmentMode(values.appType),

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

    hasAcceptedGuardianDataPolicy: validateDataPolicy(
      values.hasAcceptedGuardianDataPolicy,
    ),
    hasAcceptedMinorDataPolicy: validateDataPolicy(
      values.hasAcceptedMinorDataPolicy,
    ),
  });
}

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

function removeEmptyErrors(errors: RequestFormErrors): RequestFormErrors {
  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => Boolean(message)),
  ) as RequestFormErrors;
}
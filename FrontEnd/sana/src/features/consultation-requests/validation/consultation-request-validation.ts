import type { GuardianRelationship } from "../types/consultation-request-types";

/**
 * Reglas de validación del formulario público de solicitud (HU-2.2).
 *
 * Valida campos obligatorios, formatos de datos de contacto,
 * información del solicitante, información del menor y
 * autorización para el tratamiento de datos.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ONLY_DIGITS = /^\d+$/;
const NAME_PATTERN = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;

const PHONE_LENGTH = 10;
const DOCUMENT_MIN_LENGTH = 6;
const DOCUMENT_MAX_LENGTH = 10;
const REASON_MAX_LENGTH = 500;

/** Valores del formulario, comunes a los dos tipos de solicitante. */
export type RequestFormValues = {
  fullName: string;
  identityDocument: string;
  birthDate: string;
  email: string;
  phone: string;
  relationship: GuardianRelationship | "";
  minorFullName: string;
  minorBirthDate: string;
  residenceZoneId: string;
  consultationReason: string;
  hasAcceptedDataPolicy: boolean;
};

export type RequestFormErrors = Partial<
  Record<keyof RequestFormValues, string>
>;

/** Valida el nombre completo. */
export function validateFullName(value: string): string | undefined {
  const name = value.trim();

  if (!name) return "Escribe el nombre completo.";

  if (name.length < 3) {
    return "El nombre debe tener al menos 3 caracteres.";
  }

  if (name.length > 100) {
    return "El nombre no puede pasar de 100 caracteres.";
  }

  if (!NAME_PATTERN.test(name)) {
    return "El nombre solo admite letras, espacios, guiones y apóstrofes.";
  }

  return undefined;
}

/** Valida el número de documento. */
export function validateIdentityDocument(
  value: string,
): string | undefined {
  const document = value.trim();

  if (!document) {
    return "Escribe el número de documento.";
  }

  if (!ONLY_DIGITS.test(document)) {
    return "El documento solo admite números, sin puntos ni guiones.";
  }

  if (
    document.length < DOCUMENT_MIN_LENGTH ||
    document.length > DOCUMENT_MAX_LENGTH
  ) {
    return `El documento debe tener entre ${DOCUMENT_MIN_LENGTH} y ${DOCUMENT_MAX_LENGTH} dígitos.`;
  }

  return undefined;
}

/** Valida el correo electrónico. */
export function validateEmail(value: string): string | undefined {
  const email = value.trim();

  if (!email) {
    return "Escribe tu correo electrónico.";
  }

  if (!EMAIL_PATTERN.test(email)) {
    return "Escribe un correo válido, por ejemplo nombre@correo.com.";
  }

  return undefined;
}

/** Valida el número de teléfono. */
export function validatePhone(value: string): string | undefined {
  const phone = value.trim();

  if (!phone) {
    return "Escribe tu número de teléfono.";
  }

  if (!ONLY_DIGITS.test(phone)) {
    return "El número solo admite dígitos, sin espacios ni guiones.";
  }

  if (phone.length !== PHONE_LENGTH) {
    return `El número debe tener ${PHONE_LENGTH} dígitos.`;
  }

  return undefined;
}

/**
 * Valida una fecha de nacimiento.
 * La fecha no puede quedar vacía ni ser futura.
 */
export function validateBirthDate(
  value: string,
  label = "tu fecha de nacimiento",
): string | undefined {
  if (!value) {
    return `Selecciona ${label}.`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "La fecha no es válida.";
  }

  if (date > new Date()) {
    return "La fecha no puede ser futura.";
  }

  return undefined;
}

/**
 * Valida la fecha de nacimiento del menor.
 * La persona debe ser menor de 18 años.
 */
export function validateMinorBirthDate(
  value: string,
): string | undefined {
  const dateError = validateBirthDate(
    value,
    "la fecha de nacimiento del menor",
  );

  if (dateError) {
    return dateError;
  }

  if (calculateAge(value) >= 18) {
    return "La persona ya es mayor de edad. Vuelve al inicio y elige “Solicito para mí”.";
  }

  return undefined;
}

/** Valida el parentesco del tutor con el menor. */
export function validateRelationship(
  value: string,
): string | undefined {
  if (!value) {
    return "Selecciona tu parentesco con el menor.";
  }

  return undefined;
}

/**
 * Valida el motivo de la consulta.
 * El campo es obligatorio y tiene un máximo de 500 caracteres.
 */
export function validateConsultationReason(
  value: string,
): string | undefined {
  const reason = value.trim();

  if (!reason) {
    return "Escribe el motivo de la consulta.";
  }

  if (reason.length > REASON_MAX_LENGTH) {
    return `El motivo no puede pasar de ${REASON_MAX_LENGTH} caracteres.`;
  }

  return undefined;
}

/**
 * HU-2.2.6:
 * Sin la autorización para el tratamiento de datos
 * no se puede enviar la solicitud.
 *
 * La zona de residencia queda fuera de esta validación,
 * ya que admite la opción "No reporta" (HU-2.2.5).
 */
export function validateDataPolicy(
  accepted: boolean,
): string | undefined {
  if (!accepted) {
    return "Debes autorizar el tratamiento de datos para continuar.";
  }

  return undefined;
}

/**
 * Valida el formulario de quien solicita la atención para sí mismo.
 */
export function validateSelfRequest(
  values: RequestFormValues,
): RequestFormErrors {
  return removeEmptyErrors({
    fullName: validateFullName(values.fullName),
    identityDocument: validateIdentityDocument(
      values.identityDocument,
    ),
    birthDate: validateBirthDate(values.birthDate),
    email: validateEmail(values.email),
    phone: validatePhone(values.phone),
    consultationReason: validateConsultationReason(
      values.consultationReason,
    ),
    hasAcceptedDataPolicy: validateDataPolicy(
      values.hasAcceptedDataPolicy,
    ),
  });
}

/**
 * Valida el formulario de quien solicita como tutor o acudiente.
 */
export function validateGuardianRequest(
  values: RequestFormValues,
): RequestFormErrors {
  return removeEmptyErrors({
    fullName: validateFullName(values.fullName),
    identityDocument: validateIdentityDocument(
      values.identityDocument,
    ),
    relationship: validateRelationship(values.relationship),
    email: validateEmail(values.email),
    phone: validatePhone(values.phone),
    minorFullName: validateFullName(values.minorFullName),
    minorBirthDate: validateMinorBirthDate(
      values.minorBirthDate,
    ),
    consultationReason: validateConsultationReason(
      values.consultationReason,
    ),
    hasAcceptedDataPolicy: validateDataPolicy(
      values.hasAcceptedDataPolicy,
    ),
  });
}

/**
 * Calcula los años cumplidos a partir de una fecha de nacimiento.
 */
export function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const monthDiff = today.getMonth() - birth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birth.getDate())
  ) {
    age -= 1;
  }

  return age;
}

/**
 * Elimina del objeto de errores los campos que no tienen
 * ningún mensaje de validación.
 */
function removeEmptyErrors(
  errors: RequestFormErrors,
): RequestFormErrors {
  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => Boolean(message)),
  ) as RequestFormErrors;
}
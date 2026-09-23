import type {
  AdultDocumentType,
  Gender,
  GuardianRelationship,
} from "../types/consultation-request-types";

/**
 * Reglas de validación del formulario público de solicitud (HU-2.2).
 *
 * Cubre los criterios:
 * 3. Campos obligatorios sin diligenciar.
 * 4. Datos de contacto con formato inválido.
 * 6. Autorización de tratamiento de datos.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ONLY_DIGITS = /^\d+$/;
const NAME_PATTERN = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;

const PHONE_LENGTH = 10;
const ADULT_DOCUMENT_MIN_LENGTH = 6;
const ADULT_DOCUMENT_MAX_LENGTH = 10;
const MINOR_DOCUMENT_LENGTH = 10;
const REASON_MAX_LENGTH = 500;

/** Valores del formulario, comunes a los dos tipos de solicitante. */
export type RequestFormValues = {
  fullName: string;
  documentType: AdultDocumentType | "";
  identityDocument: string;
  birthDate: string;
  gender: Gender | "";
  email: string;
  phone: string;
  relationship: GuardianRelationship | "";
  minorFullName: string;
  minorBirthDate: string;
  minorGender: Gender | "";
  minorIdentityDocument: string;
  department: string;
  municipality: string;
  consultationReason: string;
  hasAcceptedDataPolicy: boolean;
  hasAcceptedGuardianDataPolicy: boolean;
  hasAcceptedMinorDataPolicy: boolean;
};

export type RequestFormErrors = Partial<
  Record<keyof RequestFormValues, string>
>;

/**
 * Valida el nombre completo.
 */
export function validateFullName(value: string): string | undefined {
  const name = value.trim();

  if (!name) return "Escribe el nombre completo.";

  if (name.length < 3) {
    return "El nombre debe tener al menos 3 letras.";
  }

  if (name.length > 100) {
    return "El nombre no puede pasar de 100 caracteres.";
  }

  if (!NAME_PATTERN.test(name)) {
    return "El nombre solo admite letras, espacios, guiones y apóstrofes.";
  }

  return undefined;
}

/**
 * Valida el tipo de documento.
 */
export function validateDocumentType(value: string): string | undefined {
  if (!value) return "Selecciona el tipo de documento.";

  return undefined;
}

/**
 * Valida el número de documento de un adulto.
 */
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
    document.length < ADULT_DOCUMENT_MIN_LENGTH ||
    document.length > ADULT_DOCUMENT_MAX_LENGTH
  ) {
    return `El documento debe tener entre ${ADULT_DOCUMENT_MIN_LENGTH} y ${ADULT_DOCUMENT_MAX_LENGTH} dígitos.`;
  }

  return undefined;
}

/**
 * El documento del menor es opcional:
 * puede no tener tarjeta de identidad todavía.
 */
export function validateMinorIdentityDocument(
  value: string,
): string | undefined {
  const document = value.trim();

  if (!document) return undefined;

  if (!ONLY_DIGITS.test(document)) {
    return "El documento solo admite números, sin puntos ni guiones.";
  }

  if (document.length !== MINOR_DOCUMENT_LENGTH) {
    return `La tarjeta de identidad debe tener ${MINOR_DOCUMENT_LENGTH} dígitos.`;
  }

  return undefined;
}

/**
 * Valida el correo electrónico.
 */
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

/**
 * Valida el número de teléfono.
 */
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
 *
 * El menor debe tener menos de 18 años.
 * Si ya cumplió 18, debe utilizar el flujo de solicitud propia.
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

/**
 * Valida el género.
 */
export function validateGender(value: string): string | undefined {
  if (!value) {
    return "Selecciona el género.";
  }

  return undefined;
}

/**
 * Valida el parentesco con el menor.
 */
export function validateRelationship(value: string): string | undefined {
  if (!value) {
    return "Selecciona tu parentesco con el menor.";
  }

  return undefined;
}

/**
 * El municipio es de texto libre, pero no puede quedar vacío
 * si se indicó un departamento.
 */
export function validateMunicipality(
  department: string,
  municipality: string,
): string | undefined {
  if (department && !municipality.trim()) {
    return "Escribe el municipio, o deja el departamento sin seleccionar.";
  }

  return undefined;
}

/**
 * Valida el motivo de consulta.
 */
export function validateConsultationReason(
  value: string,
): string | undefined {
  if (value.length > REASON_MAX_LENGTH) {
    return `El motivo no puede pasar de ${REASON_MAX_LENGTH} caracteres.`;
  }

  return undefined;
}

/**
 * HU-2.2.6:
 * sin la autorización no se puede enviar la solicitud.
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
 * Valida el formulario de quien solicita para sí mismo.
 */
export function validateSelfRequest(
  values: RequestFormValues,
): RequestFormErrors {
  return removeEmptyErrors({
    fullName: validateFullName(values.fullName),

    documentType: validateDocumentType(values.documentType),

    identityDocument: validateIdentityDocument(
      values.identityDocument,
    ),

    birthDate: validateBirthDate(values.birthDate),

    gender: validateGender(values.gender),

    email: validateEmail(values.email),

    phone: validatePhone(values.phone),

    municipality: validateMunicipality(
      values.department,
      values.municipality,
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
 * Valida el formulario del tutor legal.
 */
export function validateGuardianRequest(
  values: RequestFormValues,
): RequestFormErrors {
  return removeEmptyErrors({
    /**
     * Datos del tutor / solicitante.
     */
    fullName: validateFullName(values.fullName),

    documentType: validateDocumentType(values.documentType),

    identityDocument: validateIdentityDocument(
      values.identityDocument,
    ),

    gender: validateGender(values.gender),

    relationship: validateRelationship(values.relationship),

    email: validateEmail(values.email),

    phone: validatePhone(values.phone),

    /**
     * Datos del menor.
     */
    minorFullName: validateFullName(values.minorFullName),

    minorBirthDate: validateMinorBirthDate(
      values.minorBirthDate,
    ),

    minorGender: validateGender(values.minorGender),

    minorIdentityDocument: validateMinorIdentityDocument(
      values.minorIdentityDocument,
    ),

    /**
     * Ubicación y motivo de consulta.
     */
    municipality: validateMunicipality(
      values.department,
      values.municipality,
    ),

    consultationReason: validateConsultationReason(
      values.consultationReason,
    ),

    /**
     * Autorizaciones de tratamiento de datos.
     */
    hasAcceptedGuardianDataPolicy: validateDataPolicy(
      values.hasAcceptedGuardianDataPolicy,
    ),

    hasAcceptedMinorDataPolicy: validateDataPolicy(
      values.hasAcceptedMinorDataPolicy,
    ),
  });
}

/**
 * Calcula los años cumplidos a partir de una fecha ISO.
 */
export function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const monthDiff =
    today.getMonth() - birth.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 &&
      today.getDate() < birth.getDate())
  ) {
    age -= 1;
  }

  return age;
}

/**
 * Elimina los errores que no tienen mensaje.
 */
function removeEmptyErrors(
  errors: RequestFormErrors,
): RequestFormErrors {
  return Object.fromEntries(
    Object.entries(errors).filter(
      ([, message]) => Boolean(message),
    ),
  ) as RequestFormErrors;
}
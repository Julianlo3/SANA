import { requiresProfessionalData } from "../../../config/roles";

/**
 * User form validation rules.
 *
 * Rules are shared by create and edit forms and their tests.
 *
 * Identity documents and email addresses are confirmed during account
 * creation to reduce typing errors.
 */

export type UserFormValues = {
  fullName: string;
  identityDocument: string;
  confirmIdentityDocument: string;
  email: string;
  confirmEmail: string;
  contactNumber: string;
  roleIds: number[];
  licenseNumber: string;
  speciality: string;
};

/**
 * Defines the user form errors type.
 */

export type UserFormErrors = Partial<Record<keyof UserFormValues, string>>;

/**
 * Defines the email pattern.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/**
 * Defines the only digits.
 */
const ONLY_DIGITS = /^\d+$/;
/**
 * Defines the name pattern.
 */
const NAME_PATTERN = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;

/**
 * Identity providers that do not support Google sign-in.
 * Email validation does not use a domain allowlist because the foundation may
 * use custom domains managed through Google Workspace.
 */
const NON_GOOGLE_PROVIDERS = [
  "hotmail.com",
  "outlook.com",
  "outlook.es",
  "live.com",
  "yahoo.com",
  "yahoo.es",
  "icloud.com",
];

/**
 * Validates validate full name.
 * @param value Value to process.
 * @returns Formatted value or validation message.
 */
export function validateFullName(value: string): string | undefined {
  const name = value.trim();

  if (!name) return "Escribe el nombre completo.";
  if (name.length < 3) return "El nombre debe tener al menos 3 letras.";
  if (name.length > 100) return "El nombre no puede pasar de 100 caracteres.";
  if (!NAME_PATTERN.test(name)) return "El nombre solo admite letras.";

  return undefined;
}

/**
 * Validates validate identity document.
 * @param value Value to process.
 * @returns Formatted value or validation message.
 */
export function validateIdentityDocument(value: string): string | undefined {
  const document = value.trim();

  if (!document) return "Escribe el número de documento.";
  if (!ONLY_DIGITS.test(document)) {
    return "El documento solo admite números, sin puntos ni guiones.";
  }
  if (document.length < 6 || document.length > 10) {
    return "El documento debe tener entre 6 y 10 dígitos.";
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
 * Validates validate email.
 * @param value Value to process.
 * @returns Formatted value or validation message.
 */
export function validateEmail(value: string): string | undefined {
  const email = value.trim().toLowerCase();

  if (!email) return "Escribe el correo de la persona.";
  if (!EMAIL_PATTERN.test(email)) return "Escribe un correo válido.";

  const domain = email.split("@")[1];
  if (NON_GOOGLE_PROVIDERS.includes(domain)) {
    return "Con este correo no se puede entrar a SANA. Usa una cuenta de Gmail o el correo de la fundación.";
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
  if (!confirmEmail.trim()) return "Confirma el correo.";
  if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
    return "Los correos no coinciden.";
  }

  return undefined;
}

/**
 * Validates validate contact number.
 * @param value Value to process.
 * @returns Formatted value or validation message.
 */
export function validateContactNumber(value: string): string | undefined {
  const phone = value.trim();

  if (!phone) return "Escribe el número de contacto.";
  if (!ONLY_DIGITS.test(phone)) {
    return "El número solo admite dígitos, sin espacios ni guiones.";
  }
  if (phone.length !== 10) return "El número debe tener 10 dígitos.";

  return undefined;
}

/**
 * Validates validate role ids.
 * @param roleIds Role values used by the operation.
 * @returns Formatted value or validation message.
 */
export function validateRoleIds(roleIds: number[]): string | undefined {
  if (roleIds.length === 0) return "Asigna al menos un rol.";
  return undefined;
}

/**
 * Validates validate license number.
 * @param value Value to process.
 * @param roleIds Role values used by the operation.
 * @returns Formatted value or validation message.
 */
export function validateLicenseNumber(
  value: string,
  roleIds: number[],
): string | undefined {
  if (!requiresProfessionalData(roleIds)) return undefined;

  const license = value.trim();
  if (!license) return "El rol de psicólogo necesita el número de licencia.";
  if (!ONLY_DIGITS.test(license)) return "La licencia solo admite números.";

  return undefined;
}

/**
 * Validates validate speciality.
 * @param value Value to process.
 * @param roleIds Role values used by the operation.
 * @returns Formatted value or validation message.
 */
export function validateSpeciality(
  value: string,
  roleIds: number[],
): string | undefined {
  if (!requiresProfessionalData(roleIds)) return undefined;
  if (!value.trim()) return "El rol de psicólogo necesita la especialidad.";

  return undefined;
}

/**
 * Validates the create form and returns only fields with errors.
 * @param values Value to process.
 * @returns Result of the operation.
 */
export function validateUserForm(values: UserFormValues): UserFormErrors {
  return removeEmptyErrors({
    fullName: validateFullName(values.fullName),
    identityDocument: validateIdentityDocument(values.identityDocument),
    confirmIdentityDocument: validateConfirmIdentityDocument(
      values.identityDocument,
      values.confirmIdentityDocument,
    ),
    email: validateEmail(values.email),
    confirmEmail: validateConfirmEmail(values.email, values.confirmEmail),
    contactNumber: validateContactNumber(values.contactNumber),
    roleIds: validateRoleIds(values.roleIds),
    licenseNumber: validateLicenseNumber(values.licenseNumber, values.roleIds),
    speciality: validateSpeciality(values.speciality, values.roleIds),
  });
}

/**
 * Email and identity document fields are immutable during editing, so their
 * validation rules, including confirmation, are excluded.
 * @param values Value to process.
 * @returns Result of the operation.
 */
export function validateUserEditForm(values: UserFormValues): UserFormErrors {
  return removeEmptyErrors({
    fullName: validateFullName(values.fullName),
    contactNumber: validateContactNumber(values.contactNumber),
    roleIds: validateRoleIds(values.roleIds),
    licenseNumber: validateLicenseNumber(values.licenseNumber, values.roleIds),
    speciality: validateSpeciality(values.speciality, values.roleIds),
  });
}

/**
 * Removes empty errors.
 * @param errors Error value to process.
 * @returns Result of the operation.
 */
function removeEmptyErrors(errors: UserFormErrors): UserFormErrors {
  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => Boolean(message)),
  ) as UserFormErrors;
}
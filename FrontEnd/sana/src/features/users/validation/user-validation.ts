import { requiresProfessionalData } from "@/config/roles";

/**
 * Reglas de validación de usuarios.
 *
 * Vive aparte de las pantallas para que la misma regla sirva al formulario de
 * creación, al de edición y a cualquier prueba, sin duplicar código.
 */

export type UserFormValues = {
  fullName: string;
  identityDocument: string;
  email: string;
  contactNumber: string;
  roleIds: number[];
  licenseNumber: string;
  speciality: string;
};

export type UserFormErrors = Partial<Record<keyof UserFormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ONLY_DIGITS = /^\d+$/;
const NAME_PATTERN = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;

/**
 * Proveedores que no permiten iniciar sesión con Google.
 * No se valida contra una lista blanca de dominios porque la fundación puede
 * usar correos propios administrados con Google Workspace.
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

export function validateFullName(value: string): string | undefined {
  const name = value.trim();

  if (!name) return "Escribe el nombre completo.";
  if (name.length < 3) return "El nombre debe tener al menos 3 letras.";
  if (name.length > 100) return "El nombre no puede pasar de 100 caracteres.";
  if (!NAME_PATTERN.test(name)) return "El nombre solo admite letras.";

  return undefined;
}

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

export function validateContactNumber(value: string): string | undefined {
  const phone = value.trim();

  if (!phone) return "Escribe el número de contacto.";
  if (!ONLY_DIGITS.test(phone)) {
    return "El número solo admite dígitos, sin espacios ni guiones.";
  }
  if (phone.length !== 10) return "El número debe tener 10 dígitos.";

  return undefined;
}

export function validateRoleIds(roleIds: number[]): string | undefined {
  if (roleIds.length === 0) return "Asigna al menos un rol.";
  return undefined;
}

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

export function validateSpeciality(
  value: string,
  roleIds: number[],
): string | undefined {
  if (!requiresProfessionalData(roleIds)) return undefined;
  if (!value.trim()) return "El rol de psicólogo necesita la especialidad.";

  return undefined;
}

/** Valida el formulario de creación y devuelve solo los campos con error. */
export function validateUserForm(values: UserFormValues): UserFormErrors {
  return removeEmptyErrors({
    fullName: validateFullName(values.fullName),
    identityDocument: validateIdentityDocument(values.identityDocument),
    email: validateEmail(values.email),
    contactNumber: validateContactNumber(values.contactNumber),
    roleIds: validateRoleIds(values.roleIds),
    licenseNumber: validateLicenseNumber(values.licenseNumber, values.roleIds),
    speciality: validateSpeciality(values.speciality, values.roleIds),
  });
}

/**
 * En edición el correo y el documento no se tocan, así que esas reglas
 * quedan fuera.
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

function removeEmptyErrors(errors: UserFormErrors): UserFormErrors {
  return Object.fromEntries(
    Object.entries(errors).filter(([, message]) => Boolean(message)),
  ) as UserFormErrors;
}
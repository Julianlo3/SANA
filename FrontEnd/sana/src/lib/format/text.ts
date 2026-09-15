/** Iniciales para el avatar, máximo dos letras. */
export function getInitials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

/** Deja solo dígitos: se usa en documento y número de contacto. */
export function keepDigits(value: string): string {
  return value.replace(/\D/g, "");
}


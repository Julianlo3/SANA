/**
 * Returns up to two initials for an avatar label.
 * @param fullName Name value.
 * @returns Result of the operation.
 */
export function getInitials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Removes non-digit characters from identity and contact values.
 * @param value Value to process.
 * @returns Result of the operation.
 */
export function keepDigits(value: string): string {
  return value.replace(/\D/g, "");
}

import { BadRequestException } from '@nestjs/common';

/**
 * Trims each vulnerability and rejects empty values.
 * @param vulnerabilities Array of vulnerabilities.
 * @returns Normalized array of vulnerabilities.
 * @throws {BadRequestException} When a value is empty after trimming.
 */
export function normalizeVulnerabilities(
  vulnerabilities: string[] | null | undefined,
): string[] | null {
  const normalized = vulnerabilities?.map((value) => value.trim()) ?? null;
  if (normalized?.some((value) => !value)) {
    throw new BadRequestException({
      error: 'INVALID_VULNERABILITY',
      message: 'Las vulnerabilidades no pueden estar vacías',
    });
  }
  return normalized;
}

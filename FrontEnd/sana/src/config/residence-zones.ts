/**
 * Departments and municipalities are loaded dynamically from the public API
 * https://api-colombia.com (see colombia-service.ts).
 */

/**
 * Default department where the foundation mainly operates.
 */
export const DEFAULT_DEPARTMENT = "Huila";

/**
 * Option text when the person prefers not to indicate their zone.
 */
export const NO_ZONE_REPORTED_LABEL = "No reporta";

export type ColombiaDepartment = string;

/**
 * Type for the residence location of a person.
 */
export type ResidenceLocation = {
  department: string;
  municipality: string;
};
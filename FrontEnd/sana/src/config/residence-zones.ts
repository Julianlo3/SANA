/**
 * Departments and municipalities are loaded dynamically from the public API
 * https://api-colombia.com (see colombia-service.ts).
 */

/**
 * Default department where the foundation mainly operates.
 */
export const DEFAULT_DEPARTMENT = "Huila";

/**
 * Department where in-person appointments are available.
 */
export const IN_PERSON_APPOINTMENT_DEPARTMENT = "Huila";

/**
 * Checks whether a department allows in-person appointments.
 * @param department Selected department.
 * @returns Whether in-person appointments are available for the department.
 */
export function allowsInPersonAppointments(department: string): boolean {
  return (
    department.trim().toLocaleLowerCase() ===
    IN_PERSON_APPOINTMENT_DEPARTMENT.toLocaleLowerCase()
  );
}

/**
 * Option text when the person prefers not to indicate their zone.
 */
export const NO_ZONE_REPORTED_LABEL = "No reporta";

/**
 * Type for the residence location of a person.
 */
export type ResidenceLocation = {
  department: string;
  municipality: string;
};
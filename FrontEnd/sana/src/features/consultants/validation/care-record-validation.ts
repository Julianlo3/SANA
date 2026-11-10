/**
 * Validation rules for clinical care records.
 *
 * The observation is optional; psychologists may record care without adding
 * a note.
 */

const OBSERVATION_MAX_LENGTH = 1000;

/**
 * Validates validate observation.
 * @param value Value to process.
 * @returns Formatted value or validation message.
 */
export function validateObservation(value: string): string | undefined {
  if (value.length > OBSERVATION_MAX_LENGTH) {
    return `La observación no puede pasar de ${OBSERVATION_MAX_LENGTH} caracteres.`;
  }

  return undefined;
}

/**
 * Care can be recorded only for completed appointments. This check controls
 * form availability and does not replace backend validation.
 * @param appointmentStatus Current status value.
 * @returns Result of the operation.
 */
export function canRecordCare(appointmentStatus: string): boolean {
  return appointmentStatus === "completed";
}
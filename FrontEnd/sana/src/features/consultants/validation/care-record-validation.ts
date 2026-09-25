/**
 * Validación del registro de atención (HU-2.5).
 *
 * La observación es opcional (HU-2.5.2 y HU-2.5.3): el psicólogo puede
 * guardar la atención sin escribir nada.
 */

const OBSERVATION_MAX_LENGTH = 1000;

export function validateObservation(value: string): string | undefined {
  if (value.length > OBSERVATION_MAX_LENGTH) {
    return `La observación no puede pasar de ${OBSERVATION_MAX_LENGTH} caracteres.`;
  }

  return undefined;
}

/**
 * HU-2.5.7: solo se puede registrar atención sobre una cita "completed".
 * Esta función la usa la pantalla antes de habilitar el formulario, no
 * reemplaza la validación real que debe hacer el backend.
 */
export function canRecordCare(appointmentStatus: string): boolean {
  return appointmentStatus === "completed";
}
/**
 * Tipos del formulario público de solicitud de cita (HU-2.2).
 *
 * Alineados al DTO real del backend (BackEnd/backendsana/src/appointments/dto/create-appointment.dto.ts),
 * no a un contrato propio. Los nombres de campo, los valores de una letra
 * para el género, y el resto de restricciones vienen de ahí.
 *
 * Decisión de equipo: no se muestran al público los horarios reales de los
 * psicólogos. El consultante solo indica una fecha ideal como referencia;
 * toda solicitud queda "pendiente" y la asistente es quien la asigna desde
 * su bandeja (HU-2.3).
 */

/** Tipo de documento. El backend acepta las tres para cualquier persona. */
export type CardType = "CC" | "TI" | "CE";

/** Género en el código de una letra que espera el backend. */
export type Gender = "F" | "M" | "O" | "P";

/** "self": la persona pide para sí misma. "dependent": un tutor pide para un menor. */
export type PatientType = "self" | "dependent";

export type AppointmentMode = "presencial" | "virtual";

/**
 * Parentesco del tutor con el menor. Los ids salen de DataBase/init-scripts/02-inserts.sql
 * (tabla relationship): son solo estos cuatro, no hay "hermano/a" ni "otro".
 */
export type GuardianRelationshipId = 1 | 2 | 3 | 4;

export type SelfRequestPayload = {
  patientType: "self";
  requesterName: string;
  requesterCardType: CardType;
  requesterIdentityDocument: string;
  requesterContactNumber: string;
  /** Obligatorio en el formulario aunque el DTO lo tenga opcional: si falta, el backend guarda un correo falso y la confirmación no llegaría a nadie. */
  requesterEmail: string;
  requesterBirthdate: string;
  requesterGender: Gender;
  requesterTermsAccepted: true;
  appType: AppointmentMode;
  /** Opcional (HU-2.2.7). */
  appReason: string;
  /** Fecha en la que la persona preferiría la cita, con zona horaria. Solo es referencia para la asistente. */
  appDateIdeal: string | null;
};

export type GuardianRequestPayload = {
  patientType: "dependent";
  requesterName: string;
  requesterCardType: CardType;
  requesterIdentityDocument: string;
  requesterContactNumber: string;
  requesterEmail: string;
  /** El backend exige que el acudiente sea mayor de edad. */
  requesterBirthdate: string;
  requesterGender: Gender;
  requesterTermsAccepted: true;
  dependentName: string;
  /**
   * Número del registro civil (NUIP) si el menor tiene menos de 7 años,
   * o de la tarjeta de identidad si tiene 7 o más. El backend lo exige
   * siempre, sin importar la edad.
   */
  dependentIdentityDocument: string;
  dependentBirthdate: string;
  dependentGender: Gender;
  /** Si el menor no tiene contacto propio, se reutiliza el del acudiente. */
  dependentContactNumber: string;
  relationshipId: GuardianRelationshipId;
  dependentTermsAccepted: true;
  appType: AppointmentMode;
  appReason: string;
  appDateIdeal: string | null;
};

export type ConsultationRequestPayload =
  | SelfRequestPayload
  | GuardianRequestPayload;

/** Respuesta de POST /appointments/request. */
export type ConsultationRequestReceipt = {
  appId: number;
  message: string;
};
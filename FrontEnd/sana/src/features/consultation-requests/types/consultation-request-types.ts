/**
 * Tipos del dominio de solicitudes de consulta (HU-2.2 y HU-2.3).
 *
 * Este archivo es también el contrato que el frontend espera del backend.
 * Cualquier cambio hay que acordarlo antes de implementar.
 *
 * Decisión de equipo: no se muestran al público los horarios reales de los
 * psicólogos (por temas legales/de seguridad). El consultante solo indica
 * una fecha preferida como referencia; toda solicitud queda "pendiente" y
 * la asistente es quien la asigna, rechaza o confirma. La notificación por
 * correo/WhatsApp se envía únicamente cuando la asistente confirma la cita,
 * nunca al momento de enviar la solicitud.
 */

/** Quién recibirá el acompañamiento (HU-2.2.1). */
export type RequesterType = "self" | "guardian";

/** Estados de una solicitud en la bandeja (HU-2.3). */
export type RequestStatus = "pending" | "assigned" | "discarded";

/** Parentesco del tutor legal con el menor. */
export type GuardianRelationship =
  | "mother"
  | "father"
  | "grandparent"
  | "sibling"
  | "uncleAunt"
  | "legalGuardian"
  | "other";

/** Género. Obligatorio: no admite quedar sin responder salvo la opción explícita. */
export type Gender = "male" | "female" | "other" | "preferNotToSay";

/** Tipo de documento del adulto solicitante. */
export type AdultDocumentType = "cc" | "ce";

/**
 * Ubicación libre: departamento fijo del catálogo oficial, municipio en
 * texto libre (no existe todavía un catálogo nacional de municipios).
 */
export type ResidenceLocation = {
  department: string;
  municipality: string;
};

/** Datos de quien solicita para sí mismo. */
export type SelfRequestPayload = {
  requesterType: "self";
  fullName: string;
  documentType: AdultDocumentType;
  identityDocument: string;
  birthDate: string;
  gender: Gender;
  email: string;
  phone: string;
  /** Null cuando la persona deja "No reporta" (HU-2.2.5). */
  residence: ResidenceLocation | null;
  /** Opcional (HU-2.2.7). */
  consultationReason: string;
  /** Obligatorio para poder enviar (HU-2.2.6). */
  hasAcceptedDataPolicy: true;
  /** Versión de la política aceptada, como evidencia (HU-2.2.8). */
  dataPolicyVersion: string;
  /**
   * Fecha en la que la persona preferiría la cita, como referencia para la
   * asistente. Nunca reserva un cupo real: solo orienta la asignación.
   */
  preferredDate: string | null;
};

/** Datos de quien solicita como tutor legal de un menor. */
export type GuardianRequestPayload = {
  requesterType: "guardian";
  guardian: {
    fullName: string;
    identityDocument: string;
    relationship: GuardianRelationship;
    email: string;
    phone: string;
  };
  minor: {
    fullName: string;
    birthDate: string;
    gender: Gender;
    /**
     * Documento de tipo TI. Puede no existir todavía (niños pequeños),
     * por eso queda opcional.
     */
    identityDocument: string | null;
  };
  residence: ResidenceLocation | null;
  consultationReason: string;
  /** Autorización sobre los datos propios del tutor. */
  hasAcceptedGuardianDataPolicy: true;
  /** Autorización, por separado, sobre los datos del menor. */
  hasAcceptedMinorDataPolicy: true;
  dataPolicyVersion: string;
  preferredDate: string | null;
};

export type ConsultationRequestPayload =
  | SelfRequestPayload
  | GuardianRequestPayload;

/**
 * Respuesta de POST /consultation-requests (HU-2.2.2).
 * Toda solicitud queda "pending": la asignación y notificación al
 * consultante son responsabilidad de la asistente (HU-2.3), no de este envío.
 */
export type ConsultationRequestReceipt = {
  referenceNumber: string;
  status: RequestStatus;
  submittedAt: string;
};
/**
 * Tipos del dominio de solicitudes de consulta (HU-2.2 y HU-2.3).
 *
 * Este archivo es también el contrato que el frontend espera del backend.
 * Cualquier cambio hay que acordarlo antes de implementar.
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

/** Género, con opción de no responder. */
export type Gender = "female" | "male" | "other" | "preferNotToSay";

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

/** Un horario de atención disponible para asignar (HU-2.2.10). */
export type AvailableSlot = {
  id: string;
  psychologistId: number;
  psychologistName: string;
  /** ISO 8601. */
  startsAt: string;
  /** ISO 8601. */
  endsAt: string;
};

/** Datos de quien solicita para sí mismo. */
export type SelfRequestPayload = {
  requesterType: "self";
  fullName: string;
  documentType: AdultDocumentType;
  identityDocument: string;
  birthDate: string;
  gender: Gender | null;
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
  /** Presente solo si eligió un horario disponible (HU-2.2.10). */
  selectedSlotId: string | null;
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
    gender: Gender | null;
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
  selectedSlotId: string | null;
};

export type ConsultationRequestPayload =
  | SelfRequestPayload
  | GuardianRequestPayload;

/**
 * Respuesta de POST /consultation-requests (HU-2.2.2, 2.2.10 y 2.2.11).
 * Si se eligió horario y se creó la cita, status llega en "assigned" y
 * appointmentConfirmed en true. Si no había horario, queda "pending".
 */
export type ConsultationRequestReceipt = {
  referenceNumber: string;
  status: RequestStatus;
  submittedAt: string;
  appointmentConfirmed: boolean;
};
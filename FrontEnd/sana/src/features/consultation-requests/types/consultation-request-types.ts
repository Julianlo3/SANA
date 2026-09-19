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

/** Zona de residencia, del catálogo que define la fundación (HU-2.2.5). */
export type ResidenceZone = {
  id: number;
  municipality: string;
  zone: string;
};

/** Datos de quien solicita para sí mismo. */
export type SelfRequestPayload = {
  requesterType: "self";
  fullName: string;
  identityDocument: string;
  birthDate: string;
  email: string;
  phone: string;
  /** Null cuando elige "No reporta" (HU-2.2.5). */
  residenceZoneId: number | null;
  /** Opcional (HU-2.2.7). */
  consultationReason: string;
  /** Obligatorio para poder enviar (HU-2.2.6). */
  hasAcceptedDataPolicy: true;
  /** Versión de la política aceptada, como evidencia (HU-2.2.8). */
  dataPolicyVersion: string;
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
  };
  residenceZoneId: number | null;
  consultationReason: string;
  hasAcceptedDataPolicy: true;
  dataPolicyVersion: string;
};

export type ConsultationRequestPayload =
  | SelfRequestPayload
  | GuardianRequestPayload;

/** Respuesta de POST /consultation-requests (HU-2.2.2). */
export type ConsultationRequestReceipt = {
  /** Número de radicado que se muestra a la persona. */
  referenceNumber: string;
  status: RequestStatus;
  submittedAt: string;
};
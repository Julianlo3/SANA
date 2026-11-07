/**
 * Frontend request types aligned with the appointment creation API.
 */
/** Document types accepted by the request API. */
export type CardType = "CC" | "TI" | "CE";

/**
 * Single-letter gender codes accepted by the request API.
 */
export type Gender = "F" | "M" | "O" | "P";

/**
 * Identifies whether a request is for the requester or a dependent.
 */
export type PatientType = "self" | "dependent";

/**
 * Appointment delivery modes accepted by the request API.
 */
export type AppointmentMode = "presencial" | "virtual";

/**
 * Relationship identifiers accepted for a dependent request.
 */
export type GuardianRelationshipId = 1 | 2 | 3 | 4;

/**
 * Anonymized available appointment slot returned by the public API.
 */
export type ConsultantAvailabilitySlot = {
  /** Slot date in YYYY-MM-DD format. */
  date: string;
  /** Slot start time in HH:mm or HH:mm:ss format. */
  startTime: string;
  /** Slot end time in HH:mm or HH:mm:ss format. */
  endTime: string;
};

/**
 * Enforces the date field required by each request entry point.
 */
type AppointmentDateSelection =
  | {
      /** Selected evaluation slot as an ISO datetime. */
      appDate: string;
      appDateIdeal?: never;
    }
  | {
      /** Profile request flow, where a slot is assigned later. */
      appDateIdeal: null;
      appDate?: never;
    };

/**
 * Payload for a request submitted on behalf of the requester.
 */
export type SelfRequestPayload = {
  patientType: "self";
  requesterName: string;
  requesterCardType: CardType;
  requesterIdentityDocument: string;
  requesterContactNumber: string;
  requesterEmail: string;
  requesterBirthdate: string;
  requesterGender: Gender;
  requesterTermsAccepted: true;
  appType: AppointmentMode;
  appReason: string;
  /** Optional residence in "Municipality, Department" format. */
  residenceZone?: string;
} & AppointmentDateSelection;

/**
 * Payload for a request submitted by a guardian for a dependent.
 */
export type GuardianRequestPayload = {
  patientType: "dependent";
  requesterName: string;
  requesterCardType: CardType;
  requesterIdentityDocument: string;
  requesterContactNumber: string;
  requesterEmail: string;
  /** Guardian birth date; the API requires an adult requester. */
  requesterBirthdate: string;
  requesterGender: Gender;
  requesterTermsAccepted: true;
  dependentName: string;
  /** Dependent identity document, required for every age. */
  dependentIdentityDocument: string;
  dependentBirthdate: string;
  dependentGender: Gender;
  /** Dependent contact number, defaulting to the guardian's number. */
  dependentContactNumber: string;
  relationshipId: GuardianRelationshipId;
  dependentTermsAccepted: true;
  appType: AppointmentMode;
  appReason: string;
  /** Optional residence in "Municipality, Department" format. */
  residenceZone?: string;
} & AppointmentDateSelection;

/**
 * Discriminated union of supported consultation request payloads.
 */
export type ConsultationRequestPayload =
  | SelfRequestPayload
  | GuardianRequestPayload;

/**
 * Receipt returned after a consultation request is created.
 */
export type ConsultationRequestReceipt = {
  appId: number;
  message: string;
};

/**
 * DTO for clinical note history response
 */
export class ClinicalNoteHistoryDto {
  cnId!: number;
  appId!: number;
  appDate!: Date;
  psychologistName!: string;
  cnObservation!: string;
  cnCreatedAt!: Date;
  patientType!: 'self' | 'dependent';
  patientName!: string;
  patientDependentId!: number | null;
}

/**
 * DTO for consultant attention history
 */
export class ConsultantAttentionHistoryDto {
  requesterId!: number;
  requesterName!: string;
  notes: ClinicalNoteHistoryDto[];
}

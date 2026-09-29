/**
 * DTO for clinical note response
 */
export class ClinicalNoteResponseDto {
  cnId!: number;
  appId!: number;
  psyId!: number;
  cnObservation!: string;
  cnTermsAccepted!: boolean;
  cnCreatedAt!: Date;
}

/**
 * DTO for clinical note audit response
 */
export class ClinicalNoteAuditResponseDto {
  cnaId!: number;
  cnId!: number;
  psyId!: number;
  cnaDate!: Date;
  cnaIpAddress!: string;
}

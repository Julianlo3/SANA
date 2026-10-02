import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface CurrentPolicyDocument {
  id: number;
  type: string;
  version: string;
  content: string;
  effectiveFrom: Date;
}

/**
 * Repository for managing policy acceptance records
 */
@Injectable()
export class PolicyRepository {
  constructor(private readonly dataSource: DataSource) { }

  /**
   * Gets the latest policy document for a given type.
   * @param policyType The type of policy.
   * @returns The latest policy document, or null if none exists.
   */
  async getCurrentPolicyDocument(
    policyType: string,
  ): Promise<CurrentPolicyDocument | null> {
    const rows = await this.dataSource.query<{
      pd_id: number;
      pd_type: string;
      pd_version: string;
      pd_content: string;
      pd_effective_from: Date;
    }[]>(
      `SELECT pd_id, pd_type, pd_version, pd_content, pd_effective_from
       FROM policy_documents
       WHERE pd_type = $1
       ORDER BY pd_effective_from DESC, pd_id DESC
       LIMIT 1`,
      [policyType],
    );
    const document = rows[0];
    if (!document) return null;

    return {
      id: document.pd_id,
      type: document.pd_type,
      version: document.pd_version,
      content: document.pd_content,
      effectiveFrom: document.pd_effective_from,
    };
  }

  /**
   * Gets the current policy document ID for a given policy type.
   * @param policyType The type of policy.
   * @returns A promise that resolves to the policy document ID or null if not found.
   */
  async getCurrentPolicyDocumentId(policyType: string): Promise<number | null> {
    const rows = await this.dataSource.query<{ pd_id: number }[]>(
      `SELECT pd_id
       FROM policy_documents
       WHERE pd_type = $1
       ORDER BY pd_effective_from DESC
       LIMIT 1`,
      [policyType],
    );
    return rows[0]?.pd_id ?? null;
  }

  /**
   * Records acceptance of a policy by a person.
   * @param personId The ID of the person accepting the policy.
   * @param policyType The type of policy being accepted.
   * @param ipAddress Optional IP address of the acceptor.
   * @param dependentId Optional dependent ID if accepting on behalf of a dependent.
   * @param clinicalNoteId Optional clinical note ID if accepting for a specific note.
   * @param appointmentId Optional appointment ID if accepting for a specific appointment.
   * @returns A promise that resolves to the acceptance record ID.
   */
  async recordAcceptance(params: {
    personId: number;
    policyType: string;
    ipAddress?: string;
    dependentId?: number;
    clinicalNoteId?: number;
    appointmentId?: number;
  }): Promise<number> {
    const pdId = await this.getCurrentPolicyDocumentId(params.policyType);
    if (!pdId) {
      throw new Error(`No policy document found for type: ${params.policyType}`);
    }

    const rows = await this.dataSource.query<{ pa_id: number }[]>(
      `INSERT INTO policy_acceptance (
         per_id, dep_id, cn_id, pd_id, pa_ip_address, app_id
       )
       VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
       RETURNING pa_id`,
      [
        params.personId,
        params.dependentId ?? null,
        params.clinicalNoteId ?? null,
        pdId,
        params.ipAddress ?? null,
        params.appointmentId ?? null,
      ],
    );

    // Si la inserción fue omitida debido a un conflicto, devuelve el registro existente
    if (rows.length === 0) {
      const existing = await this.dataSource.query<{ pa_id: number }[]>(
        `SELECT pa_id
         FROM policy_acceptance
         WHERE per_id = $1 AND pd_id = $2
           AND dep_id IS NOT DISTINCT FROM $3::int
           AND cn_id IS NOT DISTINCT FROM $4::int
           AND app_id IS NOT DISTINCT FROM $5::int
         LIMIT 1`,
        [
          params.personId,
          pdId,
          params.dependentId ?? null,
          params.clinicalNoteId ?? null,
          params.appointmentId ?? null,
        ],
      );
      return existing[0]?.pa_id ?? 0;
    }

    return rows[0].pa_id;
  }

  /**
   * Checks if a person has accepted a specific policy type.
   * @param personId The ID of the person.
   * @param policyType The type of policy to check.
   * @param dependentId Optional dependent ID to check acceptance for.
   * @param appointmentId Optional appointment ID to check acceptance for.
   * @returns A promise that resolves to true if accepted, false otherwise.
   */
  async hasAcceptedPolicy(params: {
    personId: number;
    policyType: string;
    dependentId?: number;
    appointmentId?: number;
  }): Promise<boolean> {
    const pdId = await this.getCurrentPolicyDocumentId(params.policyType);
    if (!pdId) {
      return false;
    }

    const rows = await this.dataSource.query<{ exists: boolean }[]>(
      `SELECT EXISTS (
         SELECT 1
         FROM policy_acceptance
         WHERE per_id = $1
           AND pd_id = $2
           AND dep_id IS NOT DISTINCT FROM $3::int
           AND app_id IS NOT DISTINCT FROM $4::int
       ) AS exists`,
      [
        params.personId,
        pdId,
        params.dependentId ?? null,
        params.appointmentId ?? null,
      ],
    );
    return rows[0]?.exists ?? false;
  }

  /**
   * Checks if a psychologist has accepted the schedule terms policy.
   * Psychologists only need to accept once per version (no appointment context).
   * @param psychologistId The ID of the psychologist.
   * @returns A promise that resolves to true if accepted, false otherwise.
   */
  async hasPsychologistAcceptedScheduleTerms(psychologistId: number): Promise<boolean> {
    return this.hasAcceptedPolicy({
      personId: psychologistId,
      policyType: 'schedule_terms',
    });
  }

  /**
   * Records psychologist's acceptance of schedule terms.
   * @param psychologistId The ID of the psychologist.
   * @param ipAddress Optional IP address.
   * @returns A promise that resolves to the acceptance record ID.
   */
  async recordPsychologistScheduleTermsAcceptance(
    psychologistId: number,
    ipAddress?: string,
  ): Promise<number> {
    return this.recordAcceptance({
      personId: psychologistId,
      policyType: 'schedule_terms',
      ipAddress,
    });
  }

  /**
   * Records data treatment policy acceptance for a person (consultant).
   * @param personId The ID of the person.
   * @param appointmentId The ID of the appointment.
   * @param ipAddress Optional IP address.
   * @returns A promise that resolves to the acceptance record ID.
   */
  async recordDataTreatmentAcceptance(
    personId: number,
    appointmentId: number,
    ipAddress?: string,
  ): Promise<number> {
    return this.recordAcceptance({
      personId,
      policyType: 'data_treatment',
      appointmentId,
      ipAddress,
    });
  }

  /**
   * Records dependent consent policy acceptance.
   * @param personId The ID of the person (tutor) accepting.
   * @param dependentId The ID of the dependent.
   * @param appointmentId The ID of the appointment.
   * @param ipAddress Optional IP address.
   * @returns A promise that resolves to the acceptance record ID.
   */
  async recordDependentConsentAcceptance(
    personId: number,
    dependentId: number,
    appointmentId: number,
    ipAddress?: string,
  ): Promise<number> {
    return this.recordAcceptance({
      personId,
      policyType: 'dependent_consent',
      dependentId,
      appointmentId,
      ipAddress,
    });
  }
}

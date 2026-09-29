import { Injectable, Logger } from '@nestjs/common';
import {
  PolicyRepository,
  type CurrentPolicyDocument,
} from './policy.repository.js';

@Injectable()
export class PolicyService {
  private readonly logger = new Logger(PolicyService.name);

  constructor(private readonly repository: PolicyRepository) {}

  /**
   * Retrieves the current document for a specified policy type.
   * @param policyType The type of policy to retrieve the document for.
   * @returns A promise that resolves to the current policy document or null if not found.
   */
  async getCurrentPolicyDocument(
    policyType: string,
  ): Promise<CurrentPolicyDocument | null> {
    return this.repository.getCurrentPolicyDocument(policyType);
  }

  /**
   * Records acceptance of data treatment policy for a consultant.
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
    const paId = await this.repository.recordDataTreatmentAcceptance(
      personId,
      appointmentId,
      ipAddress,
    );
    this.logger.log(
      `Module:policy, Function:recordDataTreatmentAcceptance, result-success: personId-${personId}, appointmentId-${appointmentId}`,
    );
    return paId;
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
    const paId = await this.repository.recordDependentConsentAcceptance(
      personId,
      dependentId,
      appointmentId,
      ipAddress,
    );
    this.logger.log(
      `Module:policy, Function:recordDependentConsentAcceptance, result-success: personId-${personId}, dependentId-${dependentId}, appointmentId-${appointmentId}`,
    );
    return paId;
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
    const paId = await this.repository.recordPsychologistScheduleTermsAcceptance(
      psychologistId,
      ipAddress,
    );
    this.logger.log(
      `Module:policy, Function:recordPsychologistScheduleTermsAcceptance, result-success: psychologistId-${psychologistId}`,
    );
    return paId;
  }

  /**
   * Checks if a psychologist has accepted schedule terms.
   * @param psychologistId The ID of the psychologist.
   * @returns A promise that resolves to true if accepted, false otherwise.
   */
  async hasPsychologistAcceptedScheduleTerms(psychologistId: number): Promise<boolean> {
    return this.repository.hasPsychologistAcceptedScheduleTerms(psychologistId);
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
    return this.repository.hasAcceptedPolicy(params);
  }
}

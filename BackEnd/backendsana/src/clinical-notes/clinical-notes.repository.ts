import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface ClinicalNoteRow {
  cnId: number;
  appId: number;
  psyId: number;
  cnObservation: string;
  cnTermsAccepted: boolean;
  cnCreatedAt: Date;
}

export interface ClinicalNoteAuditRow {
  cnaId: number;
  cnId: number;
  psyId: number;
  cnaDate: Date;
  cnaIpAddress: string;
}

export interface ClinicalNoteHistoryRow {
  cnId: number;
  appId: number;
  appDate: Date;
  psychologistName: string;
  cnObservation: string;
  cnCreatedAt: Date;
}

/**
 * Repository for clinical notes with access control
 */
@Injectable()
export class ClinicalNotesRepository {
  constructor(private readonly dataSource: DataSource) { }

  /**
   * Creates a clinical note for an appointment
   * @param params The clinical note data
   * @returns The created clinical note ID
   */
  async create(params: {
    appId: number;
    psyId: number;
    cnObservation: string;
    cnTermsAccepted: boolean;
  }): Promise<number> {
    const result = await this.dataSource.query<{ cn_id: number }[]>(
      `WITH note AS (
         INSERT INTO clinical_notes (app_id, psy_id, cn_observation)
         VALUES ($1, $2, $3)
         RETURNING cn_id
       ), acceptance AS (
         INSERT INTO policy_acceptance (per_id, pd_id, cn_id)
         SELECT $2, pd.pd_id, note.cn_id
         FROM note, (
           SELECT pd_id
           FROM policy_documents
           WHERE pd_type = 'clinical_note_terms'
           ORDER BY pd_effective_from DESC
           LIMIT 1
         ) pd
         WHERE $4::boolean
       )
       SELECT cn_id FROM note`,
      [params.appId, params.psyId, params.cnObservation, params.cnTermsAccepted],
    );
    return result[0].cn_id;
  }

  /**
   * Finds a clinical note by ID with access control
   * Only the psychologist who created the note can access it
   * @param cnId The clinical note ID
   * @param psychologistId The requesting psychologist ID
   * @returns The clinical note or null if not found or access denied
   */
  async findById(cnId: number, psychologistId: number): Promise<ClinicalNoteRow | null> {
    const rows = await this.dataSource.query<ClinicalNoteRow[]>(
      `SELECT
          cn_id AS "cnId",
          app_id AS "appId",
          psy_id AS "psyId",
          cn_observation AS "cnObservation",
          EXISTS (
            SELECT 1 FROM policy_acceptance pa WHERE pa.cn_id = clinical_notes.cn_id
          ) AS "cnTermsAccepted",
          cn_created_at AS "cnCreatedAt"
       FROM clinical_notes
       WHERE cn_id = $1 AND psy_id = $2`,
      [cnId, psychologistId],
    );
    return rows[0] ?? null;
  }

  /**
   * Finds clinical notes for a specific appointment with access control
   * Only the treating psychologist can access notes for their appointments
   * @param appId The appointment ID
   * @param psychologistId The requesting psychologist ID
   * @returns Array of clinical notes or empty array
   */
  async findByAppointment(appId: number, psychologistId: number): Promise<ClinicalNoteRow[]> {
    return this.dataSource.query<ClinicalNoteRow[]>(
      `SELECT
          cn_id AS "cnId",
          app_id AS "appId",
          psy_id AS "psyId",
          cn_observation AS "cnObservation",
          EXISTS (
            SELECT 1 FROM policy_acceptance pa WHERE pa.cn_id = clinical_notes.cn_id
          ) AS "cnTermsAccepted",
          cn_created_at AS "cnCreatedAt"
       FROM clinical_notes
       WHERE app_id = $1 AND psy_id = $2
       ORDER BY cn_created_at DESC`,
      [appId, psychologistId],
    );
  }

  /**
   * Finds clinical notes history for a consultant with access control
   * Only the treating psychologist can view their own notes for a consultant
   * @param requesterId The consultant (requester) ID
   * @param psychologistId The requesting psychologist ID
   * @returns Array of clinical notes in chronological order
   */
  async findConsultantHistory(
    requesterId: number,
    psychologistId: number,
  ): Promise<ClinicalNoteHistoryRow[]> {
    return this.dataSource.query<ClinicalNoteHistoryRow[]>(
      `SELECT
          cn.cn_id AS "cnId",
          cn.app_id AS "appId",
          a.app_date AS "appDate",
          per.per_name AS "psychologistName",
          cn.cn_observation AS "cnObservation",
          cn.cn_created_at AS "cnCreatedAt"
       FROM clinical_notes cn
       JOIN appointments a ON a.app_id = cn.app_id
       JOIN person per ON per.per_id = cn.psy_id
       WHERE a.req_id = $1 AND cn.psy_id = $2
       ORDER BY cn.cn_created_at ASC`,
      [requesterId, psychologistId],
    );
  }

  /**
   * Records an audit entry for clinical note operations
   * @param params The audit parameters
   */
  async recordAudit(params: {
    cnId: number;
    psyId: number;
    ipAddress: string;
  }): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO clinical_notes_audit (cn_id, psy_id, cna_date, cna_ip_address)
       VALUES ($1, $2, now(), $3)`,
      [params.cnId, params.psyId, params.ipAddress],
    );
  }

  /**
   * Gets audit history for a clinical note with access control
   * Only the psychologist who created the note can view its audit history
   * @param cnId The clinical note ID
   * @param psychologistId The requesting psychologist ID
   * @returns Array of audit entries
   */
  async findAuditHistory(cnId: number, psychologistId: number): Promise<ClinicalNoteAuditRow[]> {
    return this.dataSource.query<ClinicalNoteAuditRow[]>(
      `SELECT
          cna_id AS "cnaId",
          cn_id AS "cnId",
          psy_id AS "psyId",
          cna_date AS "cnaDate",
          cna_ip_address AS "cnaIpAddress"
       FROM clinical_notes_audit
       WHERE cn_id = $1 AND psy_id = $2
       ORDER BY cna_date DESC`,
      [cnId, psychologistId],
    );
  }

  /**
   * Checks if an appointment exists and is in 'realizada' state
   * @param appId The appointment ID
   * @returns true if appointment exists and is 'realizada', false otherwise
   */
  async isAppointmentCompleted(appId: number): Promise<boolean> {
    const rows = await this.dataSource.query<{ app_state: string }[]>(
      `SELECT app_state FROM appointments WHERE app_id = $1`,
      [appId],
    );
    return rows.length > 0 && rows[0].app_state === 'realizada';
  }

  /**
   * Checks if the psychologist is the treating psychologist for an appointment
   * @param appId The appointment ID
   * @param psychologistId The psychologist ID
   * @returns true if the psychologist is the treating professional, false otherwise
   */
  async isTreatingPsychologist(appId: number, psychologistId: number): Promise<boolean> {
    const rows = await this.dataSource.query<{ psy_id: number }[]>(
      `SELECT psy_id FROM appointments WHERE app_id = $1`,
      [appId],
    );
    return rows.length > 0 && rows[0].psy_id === psychologistId;
  }

  /**
   * Gets appointment details for validation
   * @param appId The appointment ID
   * @returns Appointment details or null
   */
  async getAppointmentDetails(appId: number): Promise<{
    appId: number;
    appState: string;
    psyId: number | null;
    reqId: number;
  } | null> {
    const rows = await this.dataSource.query<
      { app_id: number; app_state: string; psy_id: number | null; req_id: number }[]
    >(
      `SELECT app_id, app_state, psy_id, req_id
       FROM appointments WHERE app_id = $1`,
      [appId],
    );
    if (rows.length === 0) return null;
    return {
      appId: rows[0].app_id,
      appState: rows[0].app_state,
      psyId: rows[0].psy_id,
      reqId: rows[0].req_id,
    };
  }
}

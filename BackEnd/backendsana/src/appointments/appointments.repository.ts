import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { toBogotaParts } from '../schedule/schedule.repository.js';
import type { AcceptanceChannel } from '../policy/acceptance-channel.js';

/**
 * Calculates full years of age from a civil date string (`YYYY-MM-DD`).
 * @param birthdate Date string in ISO or `YYYY-MM-DD` format.
 * @param today Reference date used for age calculation.
 * @returns Age in full years.
 */
export function calculateAge(birthdate: string, today = new Date()): number {
  const normalized = birthdate.slice(0, 10);
  const date = new Date(`${normalized}T00:00:00Z`);
  let age = today.getUTCFullYear() - date.getUTCFullYear();
  const hasHadBirthday =
    today.getUTCMonth() > date.getUTCMonth() ||
    (today.getUTCMonth() === date.getUTCMonth() &&
      today.getUTCDate() >= date.getUTCDate());

  if (!hasHadBirthday) age -= 1;
  return age;
}

/** Query executor accepted by appointment repository methods. */
export type QueryExecutor = DataSource | EntityManager;

export interface AppointmentRequesterParams {
  name: string;
  cardType: string;
  identityDocument: string;
  contactNumber: string;
  email: string;
  birthdate?: string;
  gender?: string;
  termsAccepted: boolean;
  residenceZone?: string | null;
  vulnerabilities?: string[];
}

export interface PolicyAcceptanceContext {
  ipAddress: string | null;
  channel: AcceptanceChannel;
  registeredBy?: number | null;
}

const WEB_ACCEPTANCE: PolicyAcceptanceContext = { ipAddress: null, channel: 'web' };

export class RequesterIdentityConflictError extends Error {
  constructor() {
    super('The requester email and identity document belong to different people');
    this.name = 'RequesterIdentityConflictError';
  }
}

export interface AppointmentDependentParams {
  name: string;
  identityDocument: string;
  birthdate: string;
  gender?: string;
  termsAccepted: boolean;
}

export interface AppointmentRow {
  appId: number;
  appState: string;
  appKind: 'valoracion' | 'paquete';
  carePackageId: number | null;
  appType: string;
  appDate: string | null;
  appDuration: number | null;
  appDiscardReason: string | null;
  appReason: string | null;
  appCreatedAt: string;
  requesterId: number;
  requesterName: string;
  requesterCardType: string | null;
  requesterIdentityDocument: string | null;
  requesterContactNumber: string | null;
  requesterEmail: string | null;
  patientType: 'self' | 'dependent';
  patientName: string;
  patientIdentityDocument: string | null;
  patientBirthdate: string | null;
  patientGender: string | null;
  psychologistId: number | null;
  psychologistName: string | null;
  secretaryName: string | null;
  relationshipDescription: string | null;
  calendarEventId: string | null;
  referredFromAppId?: number | null;
  referredByPsychologistId?: number | null;
  referredByPsychologistName?: string | null;
  referredToPsychologistId?: number | null;
  referredToPsychologistName?: string | null;
  referralReason?: string | null;
}

export interface RequesterAppointmentRow {
  appId: number;
  appState: string;
  appKind: 'valoracion' | 'paquete';
  carePackageId: number | null;
  appType: string;
  appDate: string | null;
  appDuration: number | null;
  appCreatedAt: string;
  patientType: 'self' | 'dependent';
  patientName: string;
  patientDependentId: number | null;
  psychologistName: string | null;
  referredFromAppId?: number | null;
  referredToPsychologistId?: number | null;
  referredToPsychologistName?: string | null;
}

export type DependentBlockingReason =
  | 'DEPENDENT_MUST_BE_MINOR'
  | 'ACTIVE_CARE_PACKAGE_EXISTS'
  | 'SUGGESTED_CARE_PACKAGE_PENDING'
  | 'FOLLOW_UP_VALUATION_REQUIRED_WITH_TREATING_PSYCHOLOGIST'
  | 'VALUATION_ALREADY_IN_PROGRESS';

export interface DependentEligibilitySummary {
  isMinor: boolean;
  hasPriorAppointments: boolean;
  hasOpenValuation: boolean;
  carePackageState: 'activo' | 'sugerido' | 'finalizado' | null;
  canRequestValuation: boolean;
  canSelectFirstSlot: boolean;
  blockingReason: DependentBlockingReason | null;
}

export interface RequesterDependentRow {
  depId: number;
  name: string;
  identityDocument: string;
  birthdate: string;
  gender: string | null;
  relationshipId: number | null;
  relationshipDescription: string | null;
  assignedAt: string;
  eligibility: DependentEligibilitySummary;
}

export interface DependentAppointmentCreatedRow {
  appId: number;
  requesterName: string;
  requesterEmail: string | null;
  dependentName: string;
}

export interface RelationshipRow {
  relId: number;
  relDescription: string;
}

export interface PsychologistOptionRow {
  psyId: number;
  name: string;
  speciality: string;
  licenseNumber: number;
}

export interface PsychologistHistoryRow {
  psyId: number;
  psychologistName: string;
  totalAppointments: number;
  currentStreak: number;
  lastAppointmentDate: string;
}

/** 
 * Repository for the appointments table and related entities.
 */
@Injectable()
export class AppointmentsRepository {
  constructor(private readonly dataSource: DataSource) { }

  /**
   * finds all appointments with optional state filter (for secretary - excludes appReason)
   * @param state optional filter by appointment state
   * @returns array of appointments or null
   */
  async findAll(state?: string): Promise<AppointmentRow[]> {
    const params: unknown[] = [];
    let whereClause = '';
    if (state) {
      params.push(state);
      whereClause = `WHERE a.app_state = $${params.length}`;
    }

    return this.dataSource.query<AppointmentRow[]>(
      `SELECT
          a.app_id                                   AS "appId",
          a.app_state                                AS "appState",
          a.app_kind                                 AS "appKind",
          a.cp_id                                    AS "carePackageId",
          a.app_type                                 AS "appType",
          a.app_date                                 AS "appDate",
          a.app_duration                             AS "appDuration",
          a.app_discard_reason                       AS "appDiscardReason",
          NULL::text                                 AS "appReason",
          a.app_created_at                           AS "appCreatedAt",
          req.per_id                                 AS "requesterId",
          req.per_name                               AS "requesterName",
          req.per_card_type                          AS "requesterCardType",
          req.per_identity_document                  AS "requesterIdentityDocument",
          req.per_contact_number                     AS "requesterContactNumber",
          req.per_email                              AS "requesterEmail",
          CASE
            WHEN a.app_patient_dependent_id IS NOT NULL THEN 'dependent'
            ELSE 'self'
          END                                        AS "patientType",
          COALESCE(dep.dep_name, req.per_name)       AS "patientName",
          COALESCE(dep.dep_identity_document::text, req.per_identity_document::text) AS "patientIdentityDocument",
          COALESCE(dep.dep_birthdate::text, req.per_birthdate::text) AS "patientBirthdate",
          COALESCE(dep.dep_gender, req.per_gender)   AS "patientGender",
          a.psy_id                                   AS "psychologistId",
          psy_per.per_name                           AS "psychologistName",
          sec_per.per_name                           AS "secretaryName",
          rel.rel_description                        AS "relationshipDescription",
          a.app_calendar_event_id                    AS "calendarEventId",
          a.app_referred_from_app_id                 AS "referredFromAppId",
          ref_app.psy_id                             AS "referredByPsychologistId",
          ref_by_per.per_name                        AS "referredByPsychologistName",
          a.app_referred_to_psy_id                   AS "referredToPsychologistId",
          ref_to_per.per_name                        AS "referredToPsychologistName",
          a.app_referral_reason                      AS "referralReason"
        FROM appointments a
        JOIN person req ON req.per_id = a.req_id
        LEFT JOIN dependents dep ON dep.dep_id = a.app_patient_dependent_id
        LEFT JOIN requester_dependent rd ON rd.req_id = a.req_id AND rd.dep_id = a.app_patient_dependent_id
        LEFT JOIN relationship rel ON rel.rel_id = rd.rel_id
        LEFT JOIN person psy_per ON psy_per.per_id = a.psy_id
        LEFT JOIN person sec_per ON sec_per.per_id = a.sec_id
        LEFT JOIN appointments ref_app ON ref_app.app_id = a.app_referred_from_app_id
        LEFT JOIN person ref_by_per ON ref_by_per.per_id = ref_app.psy_id
        LEFT JOIN person ref_to_per ON ref_to_per.per_id = a.app_referred_to_psy_id
        ${whereClause}
        ORDER BY a.app_created_at DESC`,
      params,
    );
  }

  /**
   * Finds appointments requested by a specific requester.
   * @param requesterId The ID of the requester.
   * @returns A promise resolving to the list of requested appointments.
   */
  findByRequester(requesterId: number): Promise<RequesterAppointmentRow[]> {
    return this.dataSource.query<RequesterAppointmentRow[]>(
      `SELECT
          a.app_id AS "appId",
          a.app_state AS "appState",
          a.app_kind AS "appKind",
          a.cp_id AS "carePackageId",
          a.app_type AS "appType",
          a.app_date AS "appDate",
          a.app_duration AS "appDuration",
          a.app_created_at AS "appCreatedAt",
          CASE
            WHEN a.app_patient_dependent_id IS NOT NULL THEN 'dependent'
            ELSE 'self'
          END AS "patientType",
          COALESCE(dep.dep_name, req.per_name) AS "patientName",
          a.app_patient_dependent_id AS "patientDependentId",
          psy.per_name AS "psychologistName",
          a.app_referred_from_app_id AS "referredFromAppId",
          a.app_referred_to_psy_id AS "referredToPsychologistId",
          ref_to_per.per_name AS "referredToPsychologistName"
        FROM appointments a
        JOIN person req ON req.per_id = a.req_id
        LEFT JOIN dependents dep ON dep.dep_id = a.app_patient_dependent_id
        LEFT JOIN person psy ON psy.per_id = a.psy_id
        LEFT JOIN person ref_to_per ON ref_to_per.per_id = a.app_referred_to_psy_id
        WHERE a.req_id = $1
        ORDER BY a.app_created_at DESC`,
      [requesterId],
    );
  }

  /**
   * finds an appointment by id (for secretary - excludes appReason)
   * @param appId appointment id
   * @returns appointment or null
   */
  async findById(appId: number): Promise<AppointmentRow | null> {
    const rows = await this.dataSource.query<AppointmentRow[]>(
      `SELECT
          a.app_id                                   AS "appId",
          a.app_state                                AS "appState",
          a.app_kind                                 AS "appKind",
          a.cp_id                                    AS "carePackageId",
          a.app_type                                 AS "appType",
          a.app_date                                 AS "appDate",
          a.app_duration                             AS "appDuration",
          a.app_discard_reason                       AS "appDiscardReason",
          NULL::text                                 AS "appReason",
          a.app_created_at                           AS "appCreatedAt",
          req.per_id                                 AS "requesterId",
          req.per_name                               AS "requesterName",
          req.per_card_type                          AS "requesterCardType",
          req.per_identity_document                  AS "requesterIdentityDocument",
          req.per_contact_number                     AS "requesterContactNumber",
          req.per_email                              AS "requesterEmail",
          CASE
            WHEN a.app_patient_dependent_id IS NOT NULL THEN 'dependent'
            ELSE 'self'
          END                                        AS "patientType",
          COALESCE(dep.dep_name, req.per_name)       AS "patientName",
          COALESCE(dep.dep_identity_document::text, req.per_identity_document::text) AS "patientIdentityDocument",
          COALESCE(dep.dep_birthdate::text, req.per_birthdate::text) AS "patientBirthdate",
          COALESCE(dep.dep_gender, req.per_gender)   AS "patientGender",
          a.psy_id                                   AS "psychologistId",
          psy_per.per_name                           AS "psychologistName",
          sec_per.per_name                           AS "secretaryName",
          rel.rel_description                        AS "relationshipDescription",
          a.app_calendar_event_id                    AS "calendarEventId",
          a.app_referred_from_app_id                 AS "referredFromAppId",
          ref_app.psy_id                             AS "referredByPsychologistId",
          ref_by_per.per_name                        AS "referredByPsychologistName",
          a.app_referred_to_psy_id                   AS "referredToPsychologistId",
          ref_to_per.per_name                        AS "referredToPsychologistName",
          a.app_referral_reason                      AS "referralReason"
        FROM appointments a
        JOIN person req ON req.per_id = a.req_id
        LEFT JOIN dependents dep ON dep.dep_id = a.app_patient_dependent_id
        LEFT JOIN requester_dependent rd ON rd.req_id = a.req_id AND rd.dep_id = a.app_patient_dependent_id
        LEFT JOIN relationship rel ON rel.rel_id = rd.rel_id
        LEFT JOIN person psy_per ON psy_per.per_id = a.psy_id
        LEFT JOIN person sec_per ON sec_per.per_id = a.sec_id
        LEFT JOIN appointments ref_app ON ref_app.app_id = a.app_referred_from_app_id
        LEFT JOIN person ref_by_per ON ref_by_per.per_id = ref_app.psy_id
        LEFT JOIN person ref_to_per ON ref_to_per.per_id = a.app_referred_to_psy_id
        WHERE a.app_id = $1`,
      [appId],
    );
    return rows[0] ?? null;
  }

  /**
   * finds an appointment by id for psychologist (includes appReason)
   * @param appId appointment id
   * @returns appointment or null
   */
  async findByIdForPsychologist(appId: number): Promise<AppointmentRow | null> {
    const rows = await this.dataSource.query<AppointmentRow[]>(
      `SELECT
          a.app_id                                   AS "appId",
          a.app_state                                AS "appState",
          a.app_kind                                 AS "appKind",
          a.cp_id                                    AS "carePackageId",
          a.app_type                                 AS "appType",
          a.app_date                                 AS "appDate",
          a.app_duration                             AS "appDuration",
          a.app_discard_reason                       AS "appDiscardReason",
          a.app_reason                               AS "appReason",
          a.app_created_at                           AS "appCreatedAt",
          req.per_id                                 AS "requesterId",
          req.per_name                               AS "requesterName",
          req.per_card_type                          AS "requesterCardType",
          req.per_identity_document                  AS "requesterIdentityDocument",
          req.per_contact_number                     AS "requesterContactNumber",
          req.per_email                              AS "requesterEmail",
          CASE
            WHEN a.app_patient_dependent_id IS NOT NULL THEN 'dependent'
            ELSE 'self'
          END                                        AS "patientType",
          COALESCE(dep.dep_name, req.per_name)       AS "patientName",
          COALESCE(dep.dep_identity_document::text, req.per_identity_document::text) AS "patientIdentityDocument",
          COALESCE(dep.dep_birthdate::text, req.per_birthdate::text) AS "patientBirthdate",
          COALESCE(dep.dep_gender, req.per_gender)   AS "patientGender",
          a.psy_id                                   AS "psychologistId",
          psy_per.per_name                           AS "psychologistName",
          sec_per.per_name                           AS "secretaryName",
          rel.rel_description                        AS "relationshipDescription",
          a.app_calendar_event_id                    AS "calendarEventId",
          a.app_referred_from_app_id                 AS "referredFromAppId",
          ref_app.psy_id                             AS "referredByPsychologistId",
          ref_by_per.per_name                        AS "referredByPsychologistName",
          a.app_referred_to_psy_id                   AS "referredToPsychologistId",
          ref_to_per.per_name                        AS "referredToPsychologistName",
          a.app_referral_reason                      AS "referralReason"
        FROM appointments a
        JOIN person req ON req.per_id = a.req_id
        LEFT JOIN dependents dep ON dep.dep_id = a.app_patient_dependent_id
        LEFT JOIN requester_dependent rd ON rd.req_id = a.req_id AND rd.dep_id = a.app_patient_dependent_id
        LEFT JOIN relationship rel ON rel.rel_id = rd.rel_id
        LEFT JOIN person psy_per ON psy_per.per_id = a.psy_id
        LEFT JOIN person sec_per ON sec_per.per_id = a.sec_id
        LEFT JOIN appointments ref_app ON ref_app.app_id = a.app_referred_from_app_id
        LEFT JOIN person ref_by_per ON ref_by_per.per_id = ref_app.psy_id
        LEFT JOIN person ref_to_per ON ref_to_per.per_id = a.app_referred_to_psy_id
        WHERE a.app_id = $1`,
      [appId],
    );
    return rows[0] ?? null;
  }

  /**
   * finds appointments for a specific psychologist (includes appReason)
   * @param psychologistId psychologist id
   * @param state optional filter by appointment state
   * @returns array of appointments or null
   */
  async findByPsychologist(psychologistId: number, state?: string): Promise<AppointmentRow[]> {
    const params: unknown[] = [psychologistId];
    let whereClause = `WHERE a.psy_id = $1`;
    if (state) {
      params.push(state);
      whereClause += ` AND a.app_state = $${params.length}`;
    }

    return this.dataSource.query<AppointmentRow[]>(
      `SELECT
          a.app_id                                   AS "appId",
          a.app_state                                AS "appState",
          a.app_kind                                 AS "appKind",
          a.cp_id                                    AS "carePackageId",
          a.app_type                                 AS "appType",
          a.app_date                                 AS "appDate",
          a.app_duration                             AS "appDuration",
          a.app_discard_reason                       AS "appDiscardReason",
          a.app_reason                               AS "appReason",
          a.app_created_at                           AS "appCreatedAt",
          req.per_id                                 AS "requesterId",
          req.per_name                               AS "requesterName",
          req.per_card_type                          AS "requesterCardType",
          req.per_identity_document                  AS "requesterIdentityDocument",
          req.per_contact_number                     AS "requesterContactNumber",
          req.per_email                              AS "requesterEmail",
          CASE
            WHEN a.app_patient_dependent_id IS NOT NULL THEN 'dependent'
            ELSE 'self'
          END                                        AS "patientType",
          COALESCE(dep.dep_name, req.per_name)       AS "patientName",
          COALESCE(dep.dep_identity_document::text, req.per_identity_document::text) AS "patientIdentityDocument",
          COALESCE(dep.dep_birthdate::text, req.per_birthdate::text) AS "patientBirthdate",
          COALESCE(dep.dep_gender, req.per_gender)   AS "patientGender",
          a.psy_id                                   AS "psychologistId",
          psy_per.per_name                           AS "psychologistName",
          sec_per.per_name                           AS "secretaryName",
          rel.rel_description                        AS "relationshipDescription",
          a.app_calendar_event_id                    AS "calendarEventId",
          a.app_referred_from_app_id                 AS "referredFromAppId",
          ref_app.psy_id                             AS "referredByPsychologistId",
          ref_by_per.per_name                        AS "referredByPsychologistName",
          a.app_referred_to_psy_id                   AS "referredToPsychologistId",
          ref_to_per.per_name                        AS "referredToPsychologistName",
          a.app_referral_reason                      AS "referralReason"
        FROM appointments a
        JOIN person req ON req.per_id = a.req_id
        LEFT JOIN dependents dep ON dep.dep_id = a.app_patient_dependent_id
        LEFT JOIN requester_dependent rd ON rd.req_id = a.req_id AND rd.dep_id = a.app_patient_dependent_id
        LEFT JOIN relationship rel ON rel.rel_id = rd.rel_id
        LEFT JOIN person psy_per ON psy_per.per_id = a.psy_id
        LEFT JOIN person sec_per ON sec_per.per_id = a.sec_id
        LEFT JOIN appointments ref_app ON ref_app.app_id = a.app_referred_from_app_id
        LEFT JOIN person ref_by_per ON ref_by_per.per_id = ref_app.psy_id
        LEFT JOIN person ref_to_per ON ref_to_per.per_id = a.app_referred_to_psy_id
        ${whereClause}
        ORDER BY a.app_date ASC`,
      params,
    );
  }

  /**
   * Lists minor dependents registered under a specific requester along with
   * each dependent's current valuation eligibility.
   * @param requesterId The requester (person) ID.
   * @returns A promise resolving to the requester's registered dependents.
   */
  async findDependentsByRequester(
    requesterId: number,
  ): Promise<RequesterDependentRow[]> {
    const rows = await this.dataSource.query<RawDependentEligibilityRow[]>(
      `SELECT
          d.dep_id AS "depId",
          d.dep_name AS "name",
          d.dep_identity_document::text AS "identityDocument",
          d.dep_birthdate::text AS "birthdate",
          d.dep_gender AS "gender",
          rd.rel_id AS "relationshipId",
          rel.rel_description AS "relationshipDescription",
          rd.rd_assigned_at AS "assignedAt",
          (
            SELECT COUNT(1)::int
            FROM appointments a
            WHERE a.app_patient_dependent_id = d.dep_id
              AND a.app_state NOT IN ('descartada', 'cancelada')
          ) AS "priorAppointmentsCount",
          EXISTS (
            SELECT 1
            FROM appointments a
            WHERE a.app_patient_dependent_id = d.dep_id
              AND a.app_kind = 'valoracion'
              AND a.app_state IN ('pendiente', 'remitida', 'asignada', 'confirmada')
          ) AS "hasOpenValuation",
          (
            SELECT cp.cp_state
            FROM care_packages cp
            WHERE cp.cp_patient_dependent_id = d.dep_id
              AND cp.cp_state IN ('activo', 'sugerido', 'finalizado')
            ORDER BY
              CASE cp.cp_state
                WHEN 'activo' THEN 1
                WHEN 'sugerido' THEN 2
                WHEN 'finalizado' THEN 3
                ELSE 4
              END,
              cp.cp_id DESC
            LIMIT 1
          ) AS "carePackageState"
       FROM requester_dependent rd
       JOIN dependents d ON d.dep_id = rd.dep_id
       LEFT JOIN relationship rel ON rel.rel_id = rd.rel_id
       WHERE rd.req_id = $1
       ORDER BY d.dep_name ASC, d.dep_id ASC`,
      [requesterId],
    );

    return rows.map((row) => mapRequesterDependentRow(row));
  }

  /**
   * Finds a single registered dependent belonging to the specified requester.
   * @param requesterId The requester (person) ID.
   * @param depId The dependent ID.
   * @returns A promise resolving to the dependent with eligibility, or null if not owned.
   */
  async findDependentByIdForRequester(
    requesterId: number,
    depId: number,
  ): Promise<RequesterDependentRow | null> {
    const rows = await this.dataSource.query<RawDependentEligibilityRow[]>(
      `SELECT
          d.dep_id AS "depId",
          d.dep_name AS "name",
          d.dep_identity_document::text AS "identityDocument",
          d.dep_birthdate::text AS "birthdate",
          d.dep_gender AS "gender",
          rd.rel_id AS "relationshipId",
          rel.rel_description AS "relationshipDescription",
          rd.rd_assigned_at AS "assignedAt",
          (
            SELECT COUNT(1)::int
            FROM appointments a
            WHERE a.app_patient_dependent_id = d.dep_id
              AND a.app_state NOT IN ('descartada', 'cancelada')
          ) AS "priorAppointmentsCount",
          EXISTS (
            SELECT 1
            FROM appointments a
            WHERE a.app_patient_dependent_id = d.dep_id
              AND a.app_kind = 'valoracion'
              AND a.app_state IN ('pendiente', 'remitida', 'asignada', 'confirmada')
          ) AS "hasOpenValuation",
          (
            SELECT cp.cp_state
            FROM care_packages cp
            WHERE cp.cp_patient_dependent_id = d.dep_id
              AND cp.cp_state IN ('activo', 'sugerido', 'finalizado')
            ORDER BY
              CASE cp.cp_state
                WHEN 'activo' THEN 1
                WHEN 'sugerido' THEN 2
                WHEN 'finalizado' THEN 3
                ELSE 4
              END,
              cp.cp_id DESC
            LIMIT 1
          ) AS "carePackageState"
       FROM requester_dependent rd
       JOIN dependents d ON d.dep_id = rd.dep_id
       LEFT JOIN relationship rel ON rel.rel_id = rd.rel_id
       WHERE rd.req_id = $1 AND rd.dep_id = $2
       LIMIT 1`,
      [requesterId, depId],
    );

    return rows[0] ? mapRequesterDependentRow(rows[0]) : null;
  }

  /**
   * Registers a new minor dependent and links them to the authenticated requester.
   * Enforces the single-guardian ownership invariant on `dep_identity_document`.
   * @param params Dependent creation parameters and requester ID.
   * @returns A promise resolving to the newly created dependent ID.
   */
  async createDependentForRequester(params: {
    requesterId: number;
    name: string;
    identityDocument: string;
    birthdate: string;
    gender?: string;
    relationshipId: number;
  }): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      const requesterRows = await manager.query<{
        per_id: number;
        identity_document: string | null;
      }[]>(
        `SELECT per_id, per_identity_document::text AS identity_document
         FROM person
         WHERE per_id = $1`,
        [params.requesterId],
      );
      const requester = requesterRows[0];
      if (!requester) {
        throw new NotFoundException({
          error: 'REQUESTER_NOT_FOUND',
          message: 'No se encontró la cuenta del consultante',
        });
      }
      if (
        requester.identity_document !== null &&
        requester.identity_document === params.identityDocument
      ) {
        throw new BadRequestException({
          error: 'DEPENDENT_SAME_DOCUMENT_AS_REQUESTER',
          message: 'El documento de identidad del dependiente no puede ser igual al del solicitante',
        });
      }

      const existing = await manager.query<{
        dep_id: number;
        req_id: number | null;
      }[]>(
        `SELECT d.dep_id, rd.req_id
         FROM dependents d
         LEFT JOIN requester_dependent rd ON rd.dep_id = d.dep_id
         WHERE d.dep_identity_document = $1::bigint
         FOR UPDATE OF d`,
        [params.identityDocument],
      );

      if (existing.length > 0) {
        const ownedByAnother = existing.some(
          (row) => row.req_id !== null && Number(row.req_id) !== params.requesterId,
        );
        if (ownedByAnother) {
          throw new ConflictException({
            error: 'DEPENDENT_BELONGS_TO_ANOTHER_REQUESTER',
            message:
              'Este documento de dependiente ya se encuentra registrado bajo otro acudiente. Si requiere actualizar la representación legal, comuníquese con secretaría.',
          });
        }
        const alreadyOwned = existing.some(
          (row) => row.req_id !== null && Number(row.req_id) === params.requesterId,
        );
        if (alreadyOwned) {
          throw new ConflictException({
            error: 'DEPENDENT_ALREADY_REGISTERED',
            message: 'Este dependiente ya está registrado en tu cuenta.',
          });
        }

        const orphanDepId = existing[0].dep_id;
        await this.linkRequesterDependent(
          params.requesterId,
          orphanDepId,
          params.relationshipId,
          manager,
        );
        return orphanDepId;
      }

      const created = await manager.query<{ dep_id: number }[]>(
        `INSERT INTO dependents (
           dep_name, dep_identity_document, dep_birthdate, dep_gender
         )
         VALUES ($1, $2::bigint, $3::date, $4)
         RETURNING dep_id`,
        [
          params.name,
          params.identityDocument,
          params.birthdate,
          params.gender ?? null,
        ],
      );
      const depId = created[0].dep_id;

      await this.linkRequesterDependent(
        params.requesterId,
        depId,
        params.relationshipId,
        manager,
      );

      return depId;
    });
  }

  /**
   * Creates a valuation appointment request for a dependent already registered
   * under the authenticated requester.
   * @param params Request creation details for the existing dependent.
   * @returns A promise resolving to the created appointment and notification metadata.
   */
  async createRequestForExistingDependent(params: {
    requesterId: number;
    depId: number;
    appType: string;
    appReason: string | null;
    dependentTermsAccepted: boolean;
    acceptance?: PolicyAcceptanceContext;
    slot?: {
      appDate: Date;
      duration: number;
    } | null;
  }): Promise<DependentAppointmentCreatedRow> {
    return this.dataSource.transaction(async (manager) => {
      const ownershipRows = await manager.query<{
        dep_id: number;
        dep_name: string;
        dep_birthdate: string;
        per_id: number;
        per_name: string;
        per_email: string | null;
        per_identity_document: string | null;
        per_card_type: string | null;
        per_contact_number: string | null;
        per_birthdate: string | null;
      }[]>(
        `SELECT
           d.dep_id,
           d.dep_name,
           d.dep_birthdate::text AS dep_birthdate,
           req.per_id,
           req.per_name,
           req.per_email,
           req.per_identity_document::text AS per_identity_document,
           req.per_card_type,
           req.per_contact_number::text AS per_contact_number,
           req.per_birthdate::text AS per_birthdate
         FROM requester_dependent rd
         JOIN dependents d ON d.dep_id = rd.dep_id
         JOIN person req ON req.per_id = rd.req_id
         WHERE rd.req_id = $1 AND rd.dep_id = $2
         FOR UPDATE OF d`,
        [params.requesterId, params.depId],
      );

      const record = ownershipRows[0];
      if (!record) {
        throw new NotFoundException({
          error: 'DEPENDENT_NOT_FOUND',
          message: 'No se encontró el dependiente asociado a su cuenta',
        });
      }

      if (
        !record.per_identity_document ||
        !record.per_card_type ||
        !record.per_contact_number ||
        !record.per_birthdate
      ) {
        throw new BadRequestException({
          error: 'REQUESTER_PROFILE_INCOMPLETE',
          message:
            'Debe completar sus datos personales (documento, teléfono y fecha de nacimiento) antes de solicitar una cita para su dependiente',
        });
      }

      if (calculateAge(record.per_birthdate) < 18) {
        throw new BadRequestException({
          error: 'REQUESTER_MUST_BE_ADULT',
          message: 'La persona solicitante o acudiente debe ser mayor de edad',
        });
      }

      if (calculateAge(record.dep_birthdate) >= 18) {
        throw new BadRequestException({
          error: 'DEPENDENT_MUST_BE_MINOR',
          message:
            'El dependiente ya es mayor de edad y debe solicitar su cita con su propia cuenta',
        });
      }

      await this.assertPatientEligibleForGeneralValuation(
        null,
        params.depId,
        manager,
      );

      const chosenSlot = params.slot
        ? await this.resolveFirstValuationSlot(
            params.requesterId,
            params.depId,
            params.slot,
            manager,
          )
        : null;

      await this.ensureRequesterRole(params.requesterId, manager);

      const appId = await this.create(
        {
          requesterId: params.requesterId,
          patientPersonId: null,
          patientDependentId: params.depId,
          appType: params.appType,
          appReason: params.appReason,
          slot: chosenSlot,
        },
        manager,
      );

      await this.recordPolicyAcceptances(
        appId,
        params.requesterId,
        params.depId,
        true,
        params.dependentTermsAccepted,
        params.acceptance ?? WEB_ACCEPTANCE,
        manager,
      );

      return {
        appId,
        requesterName: record.per_name,
        requesterEmail: record.per_email,
        dependentName: record.dep_name,
      };
    });
  }

  /**
   * Counts prior non-cancelled appointments for a consultant or their dependent.
   * Used to determine if the requested appointment is the 1st one or from the 2nd onwards.
   * @param requesterId The requester ID.
   * @param patientDependentId Optional dependent ID.
   * @param excludeAppId Optional appointment ID to exclude.
   * @param executor Query executor.
   * @returns Number of prior appointments.
   */
  async countPriorAppointments(
    requesterId: number,
    patientDependentId: number | null,
    excludeAppId?: number,
    executor: QueryExecutor = this.dataSource,
  ): Promise<number> {
    const excludeFilter = excludeAppId ? 'AND app_id <> $3' : '';
    const params = excludeAppId
      ? [requesterId, patientDependentId, excludeAppId]
      : [requesterId, patientDependentId];

    const result = await executor.query<{ count: string | number }[]>(
      `SELECT COUNT(1)::int AS count
       FROM appointments
       WHERE (
           ($2::int IS NOT NULL AND app_patient_dependent_id = $2)
           OR ($2::int IS NULL AND req_id = $1 AND app_patient_dependent_id IS NULL)
         )
         AND app_state NOT IN ('descartada', 'cancelada')
         ${excludeFilter}`,
      params,
    );
    return Number(result[0]?.count ?? 0);
  }

  /**
   * Finds a person by identity document.
   * @param identityDocument The document number.
   * @param executor Query executor.
   * @returns Person record or null.
   */
  async findPersonByIdentityDocument(
    identityDocument: string,
    executor: QueryExecutor = this.dataSource,
  ): Promise<{ per_id: number } | null> {
    const result = await executor.query<{ per_id: number }[]>(
      `SELECT per_id FROM person WHERE per_identity_document = $1::bigint LIMIT 1`,
      [identityDocument],
    );
    return result[0] ?? null;
  }

  async createRequest(params: {
    requester: AppointmentRequesterParams;
    dependent: (AppointmentDependentParams & { relationshipId: number }) | null;
    appType: string;
    appReason: string | null;
    authenticatedPersonId?: number;
    acceptance?: PolicyAcceptanceContext;
    slot?: {
      appDate: Date;
      duration: number;
    } | null;
  }): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      const requesterId = params.authenticatedPersonId
        ? await this.upsertAuthenticatedRequester(
          params.authenticatedPersonId,
          params.requester,
          manager,
        )
        : await this.upsertRequester(params.requester, manager);
      if (params.requester.vulnerabilities !== undefined) {
        await manager.query(
          `UPDATE person
           SET per_vulnerabilities = $2::varchar(75)[],
               per_update_date = now()
           WHERE per_id = $1`,
          [requesterId, params.requester.vulnerabilities],
        );
      }
      let patientPersonId: number | null = requesterId;
      let patientDependentId: number | null = null;

      if (params.dependent) {
        patientPersonId = null;
        patientDependentId = await this.upsertDependent(
          params.dependent,
          requesterId,
          manager,
        );
        await this.linkRequesterDependent(
          requesterId,
          patientDependentId,
          params.dependent.relationshipId,
          manager,
        );
      }

      await this.assertPatientEligibleForGeneralValuation(
        patientPersonId,
        patientDependentId,
        manager,
      );

      const chosenSlot = params.slot
        ? await this.resolveFirstValuationSlot(
            requesterId,
            patientDependentId,
            params.slot,
            manager,
          )
        : null;

      const appId = await this.create(
        {
          requesterId,
          patientPersonId,
          patientDependentId,
          appType: params.appType,
          appReason: params.appReason,
          slot: chosenSlot,
        },
        manager,
      );

      // Record policy acceptances
      await this.recordPolicyAcceptances(
        appId,
        requesterId,
        patientDependentId,
        params.requester.termsAccepted,
        params.dependent?.termsAccepted,
        params.acceptance ?? WEB_ACCEPTANCE,
        manager,
      );

      return appId;
    });
  }

  /**
   * Ensures the patient does not have an active, suggested, or finalized care package,
   * nor an open valuation appointment already in progress.
   * @param patientPersonId Person ID when the patient is the requester themselves.
   * @param patientDependentId Dependent ID when the patient is a minor dependent.
   * @param executor Query executor.
   */
  private async assertPatientEligibleForGeneralValuation(
    patientPersonId: number | null,
    patientDependentId: number | null,
    executor: QueryExecutor,
  ): Promise<void> {
    const blockingPackages = await executor.query<{
      cp_id: number;
      cp_state: 'activo' | 'sugerido' | 'finalizado';
    }[]>(
      `SELECT cp_id, cp_state
       FROM care_packages
       WHERE cp_state IN ('activo', 'sugerido', 'finalizado')
         AND (
           ($1::int IS NOT NULL AND cp_patient_person_id = $1)
           OR ($2::int IS NOT NULL AND cp_patient_dependent_id = $2)
         )
       ORDER BY
         CASE cp_state
           WHEN 'activo' THEN 1
           WHEN 'sugerido' THEN 2
           WHEN 'finalizado' THEN 3
           ELSE 4
         END,
         cp_id DESC
       LIMIT 1`,
      [patientPersonId, patientDependentId],
    );

    if (blockingPackages.length > 0) {
      const state = blockingPackages[0].cp_state;
      if (state === 'activo') {
        throw new ConflictException({
          error: 'ACTIVE_CARE_PACKAGE_EXISTS',
          message:
            'El paciente cuenta con un paquete activo. Debe agendar sus citas desde el flujo de paquetes.',
        });
      }
      if (state === 'sugerido') {
        throw new ConflictException({
          error: 'SUGGESTED_CARE_PACKAGE_PENDING',
          message:
            'El paciente ya tiene una sugerencia de paquete pendiente de aprobación por secretaría.',
        });
      }
      throw new ConflictException({
        error: 'FOLLOW_UP_VALUATION_REQUIRED_WITH_TREATING_PSYCHOLOGIST',
        message:
          'El paciente ya finalizó un paquete de atención. Debe solicitar su nueva valoración directamente con su psicólogo tratante desde la sección de paquetes.',
      });
    }

    const openValuation = await executor.query<{ app_id: number }[]>(
      `SELECT app_id
       FROM appointments
       WHERE app_kind = 'valoracion'
         AND app_state IN ('pendiente', 'remitida', 'asignada', 'confirmada')
         AND (
           ($1::int IS NOT NULL AND app_patient_person_id = $1)
           OR ($2::int IS NOT NULL AND app_patient_dependent_id = $2)
         )
       LIMIT 1`,
      [patientPersonId, patientDependentId],
    );

    if (openValuation.length > 0) {
      throw new ConflictException({
        error: 'VALUATION_ALREADY_IN_PROGRESS',
        message: 'El paciente ya tiene una cita de valoración en curso.',
      });
    }
  }

  /**
   * Reserves an available psychologist for a patient's first valuation appointment.
   * Rejects slot selection from the second appointment onwards.
   * @param requesterId Requester ID (excluded so a psychologist cannot be assigned to their own/dependent's request).
   * @param patientDependentId Dependent ID when patient is a minor, or null for self.
   * @param slot Requested appointment date and duration.
   * @param executor Query executor.
   * @returns Assigned slot with psychologist ID.
   */
  private async resolveFirstValuationSlot(
    requesterId: number,
    patientDependentId: number | null,
    slot: { appDate: Date; duration: number },
    executor: QueryExecutor,
  ): Promise<{ appDate: Date; duration: number; psyId: number }> {
    const priorCount = await this.countPriorAppointments(
      requesterId,
      patientDependentId,
      undefined,
      executor,
    );

    if (priorCount > 0) {
      throw new BadRequestException({
        error: 'SECRETARY_ASSIGNMENT_REQUIRED',
        message:
          'A partir de la segunda cita, la asignación de horarios debe ser realizada directamente por la secretaría. Por favor registre su solicitud sin horario.',
      });
    }

    const { dateStr, timeStr } = toBogotaParts(slot.appDate);
    await executor.query(
      `SELECT pg_advisory_xact_lock(hashtext('slot_assignment'), hashtext($1::text || $2::text))`,
      [dateStr, timeStr],
    );

    const availablePsychologists = await executor.query<{ psy_id: number }[]>(
      `SELECT p.psy_id
       FROM psychologist p
       JOIN person per ON per.per_id = p.psy_id
       WHERE per.per_state = 'activo'
         AND (
           EXISTS (
             SELECT 1 FROM schedule b
             WHERE b.psy_id = p.psy_id
               AND b.sch_date = $1::date
               AND b.sch_start_time <= $2::time
               AND b.sch_end_time >= ($2::time + ($3 || ' minutes')::interval)::time
           )
           OR EXISTS (
             SELECT 1 FROM schedule_recurring_blocks r
             WHERE r.psy_id = p.psy_id
               AND r.srb_active = true
               AND r.srb_day_of_week = EXTRACT(ISODOW FROM $1::date)
               AND r.srb_valid_from <= $1::date
               AND (r.srb_valid_until IS NULL OR r.srb_valid_until >= $1::date)
               AND r.srb_start_time <= $2::time
               AND r.srb_end_time >= ($2::time + ($3 || ' minutes')::interval)::time
           )
         )
         AND NOT EXISTS (
           SELECT 1 FROM schedule_occupancy o
           WHERE o.psy_id = p.psy_id
             AND o.occ_date = $1::date
             AND o.occ_start_time < ($2::time + ($3 || ' minutes')::interval)::time
             AND o.occ_end_time > $2::time
         )
         AND NOT EXISTS (
           SELECT 1 FROM appointments a
           WHERE a.psy_id = p.psy_id
             AND a.app_state IN ('asignada', 'confirmada')
             AND a.app_date IS NOT NULL
             AND (a.app_date AT TIME ZONE 'America/Bogota')::date = $1::date
             AND (a.app_date AT TIME ZONE 'America/Bogota')::time < ($2::time + ($3 || ' minutes')::interval)::time
             AND ((a.app_date + (a.app_duration || ' minutes')::interval) AT TIME ZONE 'America/Bogota')::time > $2::time
         )
         AND p.psy_id <> $4
       ORDER BY (
         SELECT COUNT(1)
         FROM appointments a2
         WHERE a2.psy_id = p.psy_id
           AND a2.app_state IN ('asignada', 'confirmada')
           AND a2.app_date >= now()
       ) ASC
       LIMIT 1`,
      [dateStr, timeStr, slot.duration, requesterId],
    );

    if (availablePsychologists.length === 0) {
      throw new ConflictException({
        error: 'SCHEDULE_SLOT_TAKEN',
        message:
          'La franja horaria seleccionada ya no se encuentra disponible. Por favor seleccione otro horario.',
      });
    }

    return {
      appDate: slot.appDate,
      duration: slot.duration,
      psyId: availablePsychologists[0].psy_id,
    };
  }

  /**
   * Records policy acceptances for the appointment request.
   * @param appId The appointment ID.
   * @param requesterId The requester (person) ID.
   * @param dependentId Optional dependent ID.
   * @param requesterTermsAccepted Whether the requester accepted terms.
   * @param dependentTermsAccepted Whether the dependent terms were accepted.
   * @param acceptance IP address, channel and staff user that registered the acceptance.
   * @param executor The query executor.
   */
  private async recordPolicyAcceptances(
    appId: number,
    requesterId: number,
    dependentId: number | null,
    requesterTermsAccepted: boolean,
    dependentTermsAccepted: boolean | undefined,
    acceptance: PolicyAcceptanceContext,
    executor: QueryExecutor,
  ): Promise<void> {
    const dataTreatmentPdId = await this.getCurrentPolicyDocumentId('data_treatment', executor);
    const dependentConsentPdId = await this.getCurrentPolicyDocumentId('dependent_consent', executor);
    const privacyPolicyPdId = await this.getCurrentPolicyDocumentId('privacy_policy', executor);

    const insertAcceptance = (pdId: number, acceptanceDependentId: number | null) =>
      executor.query(
        `INSERT INTO policy_acceptance (
           per_id, dep_id, pd_id, app_id, pa_ip_address, pa_channel, pa_registered_by
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (app_id, pd_id) WHERE app_id IS NOT NULL DO NOTHING`,
        [
          requesterId,
          acceptanceDependentId,
          pdId,
          appId,
          acceptance.ipAddress,
          acceptance.channel,
          acceptance.registeredBy ?? null,
        ],
      );

    if (requesterTermsAccepted && dataTreatmentPdId) {
      await insertAcceptance(dataTreatmentPdId, null);
    }

    if (requesterTermsAccepted && privacyPolicyPdId) {
      await insertAcceptance(privacyPolicyPdId, null);
    }

    if (dependentId && dependentTermsAccepted && dependentConsentPdId) {
      await insertAcceptance(dependentConsentPdId, dependentId);
    }
  }

  /**
   * Gets the current policy document ID for a given policy type.
   * @param policyType The type of policy.
   * @param executor The query executor.
   * @returns A promise that resolves to the policy document ID or null if not found.
   */
  private async getCurrentPolicyDocumentId(
    policyType: string,
    executor: QueryExecutor,
  ): Promise<number | null> {
    const rows = await executor.query<{ pd_id: number }[]>(
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
   * insert or update requester
   * @param params contains name, cardType, identityDocument, contactNumber, email, birthdate, gender, termsAccepted
   * @returns per_id or null
   */
  async upsertRequester(
    params: AppointmentRequesterParams,
    executor: QueryExecutor = this.dataSource,
  ): Promise<number> {
    const email = params.email.trim().toLowerCase();
    const existing = await executor.query<{
      per_id: number;
      identity_document: string | null;
      matches_identity_document: boolean | null;
      matches_email: boolean | null;
      has_user: boolean;
    }[]>(
      `SELECT
         p.per_id,
         p.per_identity_document::text AS identity_document,
         p.per_identity_document = $1::bigint AS matches_identity_document,
         lower(p.per_email) = lower($2) AS matches_email,
         u.use_id IS NOT NULL AS has_user
       FROM person p
       LEFT JOIN users u ON u.use_id = p.per_id
       WHERE p.per_identity_document = $1::bigint
          OR lower(p.per_email) = lower($2)
       FOR UPDATE OF p`,
      [params.identityDocument, email],
    );

    const documentMatch = existing.find((person) => person.matches_identity_document);
    const emailMatch = existing.find((person) => person.matches_email);
    if (
      (documentMatch || emailMatch) &&
      (!documentMatch ||
        !emailMatch ||
        documentMatch.per_id !== emailMatch.per_id ||
        documentMatch.has_user)
    ) {
      throw new RequesterIdentityConflictError();
    }

    let personId: number;
    if (documentMatch && emailMatch) {
      personId = documentMatch.per_id;
    } else {
      const created = await executor.query<{ per_id: number }[]>(
        `INSERT INTO person (
           per_name, per_card_type, per_identity_document, per_contact_number,
           per_email, per_birthdate, per_gender, per_state, per_residence_zone
         )
         VALUES ($1, $2, $3, $4, $5, $6::date, $7, 'activo', $8)
         RETURNING per_id`,
        [
          params.name,
          params.cardType,
          params.identityDocument,
          params.contactNumber,
          email,
          params.birthdate ?? null,
          params.gender ?? null,
          params.residenceZone ?? null,
        ],
      );
      personId = created[0].per_id;
    }

    await this.ensureRequesterRole(personId, executor);
    return personId;
  }

  /**
   * Updates details of a requester if they are missing
   * @param personId The ID of the person to update
   * @param params The parameters containing the details to update
   * @param executor The query executor to use for the database operation
   * @returns The ID of the requester after upsert
   */
  private async upsertAuthenticatedRequester(
    personId: number,
    params: AppointmentRequesterParams,
    executor: QueryExecutor,
  ): Promise<number> {
    const rows = await executor.query<{
      identity_document: string | null;
      matches_identity_document: boolean | null;
    }[]>(
      `SELECT
         per_identity_document::text AS identity_document,
         per_identity_document = $2::bigint AS matches_identity_document
       FROM person
       WHERE per_id = $1
       FOR UPDATE`,
      [personId, params.identityDocument],
    );
    const person = rows[0];
    if (
      !person ||
      (person.identity_document !== null &&
        !person.matches_identity_document)
    ) {
      throw new RequesterIdentityConflictError();
    }

    await this.updateMissingRequesterDetails(personId, params, executor);
    await this.ensureRequesterRole(personId, executor);
    return personId;
  }

  /**
   * Updates details of a requester if they are missing
   * @param personId The ID of the person to update
   * @param params The parameters containing the details to update
   * @param executor The query executor to use for the database operation
   */
  private async updateMissingRequesterDetails(
    personId: number,
    params: AppointmentRequesterParams,
    executor: QueryExecutor,
  ): Promise<void> {
    await executor.query(
      `UPDATE person
       SET per_identity_document = COALESCE(per_identity_document, $2::bigint),
           per_card_type = COALESCE(per_card_type, $3),
           per_contact_number = COALESCE(per_contact_number, $4::bigint),
           per_birthdate = COALESCE(per_birthdate, $5::date),
           per_gender = COALESCE(per_gender, $6),
           per_residence_zone = COALESCE(per_residence_zone, $7),
           per_update_date = now()
       WHERE per_id = $1`,
      [
        personId,
        params.identityDocument,
        params.cardType,
        params.contactNumber,
        params.birthdate ?? null,
        params.gender ?? null,
        params.residenceZone ?? null,
      ],
    );
  }

  private async ensureRequesterRole(
    personId: number,
    executor: QueryExecutor,
  ): Promise<void> {
    await executor.query(
      `INSERT INTO person_rol (per_id, rol_id, pr_assigned_at)
       VALUES ($1, 3, now())
       ON CONFLICT (per_id, rol_id) DO UPDATE
       SET pr_active = true`,
      [personId],
    );
  }

  /**
   * Inserts a new dependent or reuses an existing one only when owned by the same requester.
   * Rejects attempts to link a dependent already registered under a different guardian.
   * @param params Dependent identity fields.
   * @param requesterId The requester (guardian) person ID.
   * @param executor Query executor.
   * @returns The dependent ID (`dep_id`).
   */
  async upsertDependent(
    params: AppointmentDependentParams,
    requesterId: number,
    executor: QueryExecutor = this.dataSource,
  ): Promise<number> {
    const existing = await executor.query<{
      dep_id: number;
      req_id: number | null;
    }[]>(
      `SELECT d.dep_id, rd.req_id
       FROM dependents d
       LEFT JOIN requester_dependent rd ON rd.dep_id = d.dep_id
       WHERE d.dep_identity_document = $1::bigint
       FOR UPDATE OF d`,
      [params.identityDocument],
    );

    if (existing.length > 0) {
      const ownedByAnother = existing.some(
        (row) => row.req_id !== null && Number(row.req_id) !== requesterId,
      );
      if (ownedByAnother) {
        throw new ConflictException({
          error: 'DEPENDENT_BELONGS_TO_ANOTHER_REQUESTER',
          message:
            'Este documento de dependiente ya se encuentra registrado bajo otro acudiente. Si requiere actualizar la representación legal, comuníquese con secretaría.',
        });
      }
      return existing[0].dep_id;
    }

    const created = await executor.query<{ dep_id: number }[]>(
      `INSERT INTO dependents (
         dep_name, dep_identity_document, dep_birthdate, dep_gender
       )
       VALUES ($1, $2::bigint, $3::date, $4)
       RETURNING dep_id`,
      [
        params.name,
        params.identityDocument,
        params.birthdate,
        params.gender ?? null,
      ],
    );
    return created[0].dep_id;
  }

  /**
   * insert or update requester_dependent
   * @param requesterId requester id
   * @param dependentId dependent id
   * @param relationshipId relationship id
   * @returns void
   */
  async linkRequesterDependent(
    requesterId: number,
    dependentId: number,
    relationshipId: number | null,
    executor: QueryExecutor = this.dataSource,
  ): Promise<void> {
    await executor.query(
      `INSERT INTO requester_dependent (req_id, dep_id, rel_id, rd_assigned_at)
         VALUES ($1, $2, $3, now())
         ON CONFLICT (req_id, dep_id) DO UPDATE
         SET rel_id = COALESCE(EXCLUDED.rel_id, requester_dependent.rel_id)`,
      [requesterId, dependentId, relationshipId],
    );
  }

  /**
   * insert appointment in 'pendiente' or 'asignada' state (if slot provided)
   * @param params contains requesterId, patientPersonId, patientDependentId, appType, appReason, slot
   * @returns app_id
   */
  async create(params: {
    requesterId: number;
    patientPersonId: number | null;
    patientDependentId: number | null;
    appType: string;
    appReason: string | null;
    slot?: {
      appDate: Date;
      duration: number;
      psyId: number;
    } | null;
  }, executor: QueryExecutor = this.dataSource): Promise<number> {
    const isAssigned = Boolean(params.slot?.psyId && params.slot?.appDate);
    const query = isAssigned
      ? `INSERT INTO appointments (
           req_id, app_patient_person_id, app_patient_dependent_id,
           app_state, app_type, app_reason, app_created_at,
           psy_id, app_date, app_duration
         )
         VALUES ($1, $2, $3, 'confirmada', $4, $5, now(), $6, $7, $8)
         RETURNING app_id`
      : `INSERT INTO appointments (
           req_id, app_patient_person_id, app_patient_dependent_id,
           app_state, app_type, app_reason, app_created_at
         )
         VALUES ($1, $2, $3, 'pendiente', $4, $5, now())
         RETURNING app_id`;

    const queryParams = isAssigned
      ? [
        params.requesterId,
        params.patientPersonId,
        params.patientDependentId,
        params.appType,
        params.appReason,
        params.slot!.psyId,
        params.slot!.appDate,
        params.slot!.duration,
      ]
      : [
        params.requesterId,
        params.patientPersonId,
        params.patientDependentId,
        params.appType,
        params.appReason,
      ];

    const result = await executor.query<{ app_id: number }[]>(query, queryParams);
    const appId = result[0].app_id;

    if (isAssigned && params.slot) {
      const { dateStr, timeStr } = toBogotaParts(params.slot.appDate);
      await executor.query(
        `INSERT INTO schedule_occupancy (
           psy_id, app_id, occ_date, occ_start_time, occ_end_time, source_type
         )
         VALUES ($1, $2, $3::date, $4::time,
                 ($4::time + ($5 || ' minutes')::interval)::time, 'appointment')`,
        [params.slot.psyId, appId, dateStr, timeStr, params.slot.duration],
      );
    }

    return appId;
  }

  /**
   * confirm appointment
   * @param params contains appId, secretaryUserId, psyId, appDate, appDuration
   * @returns void
   */
  async confirm(params: {
    appId: number;
    secretaryUserId: number;
    psyId: number;
    appDate: Date;
    appDuration: number | null;
  }): Promise<void> {
    await this.dataSource.query(
      `UPDATE appointments
        SET app_state = 'confirmada',
             sec_id = $1,
             psy_id = $2,
             app_date = $3,
             app_duration = COALESCE($4, app_duration)
         WHERE app_id = $5 AND app_state = 'asignada'`,
      [
        params.secretaryUserId,
        params.psyId,
        params.appDate,
        params.appDuration,
        params.appId,
      ],
    );
  }

  /**
   * update state of an appointment
   * @param appId appointment id
   * @param state new state
   * @returns void
   */
  updateState(
    appId: number,
    state: 'cancelada' | 'realizada' | 'no_asistio',
  ): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      const updated = await manager.query<{ app_id: number }[]>(
        `UPDATE appointments
         SET app_state = $1
         WHERE app_id = $2 AND app_state = 'confirmada'
         RETURNING app_id`,
        [state, appId],
      );
      if (updated.length === 0) return false;

      if (state === 'cancelada' || state === 'no_asistio') {
        await manager.query(
          `DELETE FROM schedule_occupancy WHERE app_id = $1`,
          [appId],
        );
      }

      return true;
    });
  }

  /**
   * Auto-completes a care package if all its sessions are completed.
   * @param appId The completed appointment ID.
   */
  async autoCompleteCarePackage(appId: number): Promise<void> {
    await this.dataSource.query(
      `UPDATE care_packages cp
       SET cp_state = 'finalizado',
           cp_closed_at = now(),
           cp_close_reason = 'Completadas todas las sesiones del paquete'
       WHERE cp.cp_id = (SELECT cp_id FROM appointments WHERE app_id = $1)
         AND cp.cp_state = 'activo'
         AND (
           SELECT COUNT(*)::int
           FROM appointments a
           WHERE a.cp_id = cp.cp_id AND a.app_state = 'realizada'
         ) >= cp.cp_session_limit
         AND NOT EXISTS (
           SELECT 1 FROM appointments a
           WHERE a.cp_id = cp.cp_id AND a.app_state IN ('asignada', 'confirmada')
         )`,
      [appId],
    );
  }

  /**
   * Cancels a confirmed appointment only when it belongs to the requester, and removes its schedule occupancy.
   * @param appId The ID of the appointment to cancel.
   * @param requesterId The ID of the person requesting the cancellation.
   * @returns A promise resolving to a boolean indicating whether the cancellation was successful.
   */
  cancelByRequester(appId: number, requesterId: number): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      const updated = await manager.query<{ app_id: number }[]>(
        `UPDATE appointments
         SET app_state = 'cancelada'
         WHERE app_id = $1
           AND req_id = $2
           AND app_state = 'confirmada'
         RETURNING app_id`,
        [appId, requesterId],
      );
      if (updated.length === 0) return false;

      await manager.query(
        `DELETE FROM schedule_occupancy WHERE app_id = $1`,
        [appId],
      );
      return true;
    });
  }

  /**
   * Discards a request that has not yet been confirmed by the secretary.
   * @param appId The ID of the appointment to discard.
   * @param requesterId The ID of the person requesting the discard.
   * @returns A promise resolving to a boolean indicating whether the discard was successful.
   */
  discardByRequester(appId: number, requesterId: number): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      const updated = await manager.query<{ app_id: number }[]>(
        `UPDATE appointments
         SET app_state = 'descartada',
             app_discard_reason = 'Solicitud retirada por el consultante'
         WHERE app_id = $1
           AND req_id = $2
           AND app_state IN ('pendiente', 'remitida', 'asignada')
         RETURNING app_id`,
        [appId, requesterId],
      );
      if (updated.length === 0) return false;

      await manager.query(
        `DELETE FROM schedule_occupancy WHERE app_id = $1`,
        [appId],
      );
      return true;
    });
  }

  /**
   * discards an appointment with a given reason
   * @param appId appointment id
   * @param reason reason for discarding
   * @returns void
   */
  async discard(appId: number, reason: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const result = await manager.query(
        `UPDATE appointments
         SET app_state = 'descartada', app_discard_reason = $1
        WHERE app_id = $2 AND app_state IN('pendiente', 'remitida', 'asignada')`,
        [reason, appId],
      );
      if (result?.rowCount === 0) throw new Error('APPOINTMENT_NOT_DISCARDABLE');

      await manager.query(
        `DELETE FROM schedule_occupancy WHERE app_id = $1`,
        [appId],
      );
    });
  }

  /**
   * Checks whether a given relationship code exists.
   * @param relId The ID of the relationship to check.
   * @returns A promise resolving to a boolean indicating whether the relationship exists.
   */
  async relationshipExists(relId: number): Promise<boolean> {
    const rows = await this.dataSource.query<{ rel_id: number }[]>(
      `SELECT rel_id
       FROM relationship
       WHERE rel_id = $1
       LIMIT 1`,
      [relId],
    );
    return rows.length > 0;
  }

  /** 
   * finds available relationships for dependents (madre, padre, etc.)
   * @returns A promise resolving to the list of available relationships.
   */
  async findRelationships(): Promise<RelationshipRow[]> {
    return this.dataSource.query<RelationshipRow[]>(
      `SELECT rel_id AS "relId", rel_description AS "relDescription"
       FROM relationship
       ORDER BY rel_id`,
    );
  }

  /**
   * finds active psychologists for assignment
   * @returns array of psychologists or null
   */
  async findPsychologists(): Promise<PsychologistOptionRow[]> {
    return this.dataSource.query<PsychologistOptionRow[]>(
      `SELECT
          p.psy_id              AS "psyId",
        per.per_name          AS "name",
        p.psy_speciality      AS "speciality",
        p.psy_license_number  AS "licenseNumber"
        FROM psychologist p
        JOIN person per ON per.per_id = p.psy_id
        WHERE per.per_state = 'activo'
        ORDER BY per.per_name`,
    );
  }

  /**
   * finds the email of a specific psychologist
   * @param psychologistId The ID of the psychologist whose email is to be retrieved.
   * @returns A promise that resolves to the email of the psychologist, or null if not found.
   */
  async findPsychologistEmail(psychologistId: number): Promise<string | null> {
    const rows = await this.dataSource.query<{ per_email: string }[]>(
      `SELECT per_email
       FROM person
        WHERE per_id = $1`,
      [psychologistId],
    );
    return rows[0]?.per_email ?? null;
  }

  /**
   * Records assignment history when a psychologist is assigned or reassigned
   * @param params The parameters for recording the assignment history
   */
  async recordAssignmentHistory(params: {
    appId: number;
    oldPsyId: number | null;
    newPsyId: number;
    secId: number;
    reason: string | null;
  }): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO appointment_assignment_history
        (app_id, old_psy_id, new_psy_id, sec_id, aah_reason)
       VALUES($1, $2, $3, $4, $5)`,
      [params.appId, params.oldPsyId, params.newPsyId, params.secId, params.reason],
    );
  }

  /**
   * Finds completed-appointment history for the patient on a specific appointment.
   * @param appId The appointment that identifies the patient (self or dependent).
   * @returns Psychologist totals, latest streak, and last completed date.
   */
  async findPatientPsychologistHistory(
    appId: number,
  ): Promise<PsychologistHistoryRow[]> {
    return this.dataSource.query<PsychologistHistoryRow[]>(
      `WITH target_patient AS (
         SELECT app_patient_person_id, app_patient_dependent_id
         FROM appointments
         WHERE app_id = $1
       ), patient_appointments AS (
         SELECT a.app_id, a.psy_id, a.app_date
         FROM appointments a
         CROSS JOIN target_patient target
         WHERE a.psy_id IS NOT NULL
           AND a.app_state = 'realizada'
           AND (
             (
               target.app_patient_dependent_id IS NOT NULL
               AND a.app_patient_dependent_id = target.app_patient_dependent_id
             )
             OR (
               target.app_patient_dependent_id IS NULL
               AND a.app_patient_dependent_id IS NULL
               AND a.app_patient_person_id = target.app_patient_person_id
             )
           )
       ), ordered_appointments AS (
         SELECT
           app_id,
           psy_id,
           app_date,
           CASE
             WHEN LAG(psy_id) OVER (ORDER BY app_date, app_id) IS DISTINCT FROM psy_id
             THEN 1 ELSE 0
           END AS starts_streak
         FROM patient_appointments
       ), streak_groups AS (
         SELECT
           psy_id,
           app_date,
           SUM(starts_streak) OVER (ORDER BY app_date, app_id) AS streak_group
         FROM ordered_appointments
       ), psychologist_streaks AS (
         SELECT
           psy_id,
           streak_group,
           COUNT(*)::int AS streak_count,
           MAX(app_date) AS streak_last_date
         FROM streak_groups
         GROUP BY psy_id, streak_group
       ), ranked_streaks AS (
         SELECT
           psy_id,
           streak_count,
           ROW_NUMBER() OVER (
             PARTITION BY psy_id
             ORDER BY streak_last_date DESC, streak_group DESC
           ) AS streak_rank
         FROM psychologist_streaks
       ), psychologist_totals AS (
         SELECT
           psy_id,
           COUNT(*)::int AS total_appointments,
           MAX(app_date) AS last_appointment_date
         FROM patient_appointments
         GROUP BY psy_id
       )
       SELECT
         totals.psy_id AS "psyId",
         per.per_name AS "psychologistName",
         totals.total_appointments AS "totalAppointments",
         COALESCE(streaks.streak_count, 0) AS "currentStreak",
         totals.last_appointment_date AS "lastAppointmentDate"
       FROM psychologist_totals totals
       JOIN person per ON per.per_id = totals.psy_id
       LEFT JOIN ranked_streaks streaks
         ON streaks.psy_id = totals.psy_id AND streaks.streak_rank = 1
       ORDER BY "currentStreak" DESC, "totalAppointments" DESC,
                "lastAppointmentDate" DESC, per.per_name`,
      [appId],
    );
  }

  /**
   * Saves the Google Calendar event ID associated with an appointment.
   * @param appId The ID of the appointment.
   * @param eventId The Google Calendar event ID.
   */
  async saveCalendarEventId(appId: number, eventId: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE appointments SET app_calendar_event_id = $1 WHERE app_id = $2`,
      [eventId, appId],
    );
  }

  /**
   * Clears the Google Calendar event ID when an event is cancelled or deleted.
   * @param appId The ID of the appointment.
   */
  async clearCalendarEventId(appId: number): Promise<void> {
    await this.dataSource.query(
      `UPDATE appointments SET app_calendar_event_id = NULL WHERE app_id = $1`,
      [appId],
    );
  }

  /**
   * Finds all psychologist IDs already involved in the referral chain of a valuation appointment
   * (including the current appointment's psychologist and any ancestor valuation psychologists).
   * @param appId The valuation appointment ID.
   * @param executor Optional query executor.
   * @returns Array of psychologist IDs in the referral chain.
   */
  async findReferralChainPsychologistIds(
    appId: number,
    executor: QueryExecutor = this.dataSource,
  ): Promise<number[]> {
    const rows = await executor.query<{ psy_id: number }[]>(
      `WITH RECURSIVE referral_chain AS(
        SELECT app_id, psy_id, app_referred_from_app_id
         FROM appointments
         WHERE app_id = $1
         UNION ALL
         SELECT parent.app_id, parent.psy_id, parent.app_referred_from_app_id
         FROM appointments parent
         JOIN referral_chain rc ON rc.app_referred_from_app_id = parent.app_id
      )
       SELECT DISTINCT psy_id
       FROM referral_chain
       WHERE psy_id IS NOT NULL`,
      [appId],
    );
    return rows.map((row) => Number(row.psy_id));
  }

  /**
   * Lists active psychologists eligible to receive a referral from the specified valuation appointment,
   * excluding all psychologists already in the referral chain (to prevent referral loops)
   * and the requester themselves.
   * @param appId The valuation appointment ID.
   * @returns List of eligible psychologists with their specialities.
   */
  async findReferralCandidatePsychologists(
    appId: number,
  ): Promise<PsychologistOptionRow[]> {
    const excludedIds = await this.findReferralChainPsychologistIds(appId);
    const allActive = await this.findPsychologists();
    const excludedSet = new Set(excludedIds);
    return allActive.filter((psy) => !excludedSet.has(psy.psyId));
  }

  /**
   * Lists valuation appointments that have been referred to another psychologist
   * and are awaiting schedule assignment or confirmation by the secretary.
   * @param state Optional state filter ('remitida' by default, or 'asignada').
   * @returns List of referred appointments.
   */
  async findPendingReferrals(
    state: 'remitida' | 'asignada' = 'remitida',
  ): Promise<AppointmentRow[]> {
    return this.dataSource.query<AppointmentRow[]>(
      `SELECT
    a.app_id                                   AS "appId",
      a.app_state                                AS "appState",
        a.app_kind                                 AS "appKind",
          a.cp_id                                    AS "carePackageId",
            a.app_type                                 AS "appType",
              a.app_date                                 AS "appDate",
                a.app_duration                             AS "appDuration",
                  a.app_discard_reason                       AS "appDiscardReason",
                    NULL::text                                 AS "appReason",
                      a.app_created_at                           AS "appCreatedAt",
                        req.per_id                                 AS "requesterId",
                          req.per_name                               AS "requesterName",
                            req.per_card_type                          AS "requesterCardType",
                              req.per_identity_document                  AS "requesterIdentityDocument",
                                req.per_contact_number                     AS "requesterContactNumber",
                                  req.per_email                              AS "requesterEmail",
                                    CASE
            WHEN a.app_patient_dependent_id IS NOT NULL THEN 'dependent'
            ELSE 'self'
          END                                        AS "patientType",
      COALESCE(dep.dep_name, req.per_name)       AS "patientName",
        COALESCE(dep.dep_identity_document:: text, req.per_identity_document:: text) AS "patientIdentityDocument",
          COALESCE(dep.dep_birthdate:: text, req.per_birthdate:: text) AS "patientBirthdate",
            COALESCE(dep.dep_gender, req.per_gender)   AS "patientGender",
              a.psy_id                                   AS "psychologistId",
                psy_per.per_name                           AS "psychologistName",
                  sec_per.per_name                           AS "secretaryName",
                    rel.rel_description                        AS "relationshipDescription",
                      a.app_calendar_event_id                    AS "calendarEventId",
                        a.app_referred_from_app_id                 AS "referredFromAppId",
                          ref_app.psy_id                             AS "referredByPsychologistId",
                            ref_by_per.per_name                        AS "referredByPsychologistName",
                              a.app_referred_to_psy_id                   AS "referredToPsychologistId",
                                ref_to_per.per_name                        AS "referredToPsychologistName",
                                  a.app_referral_reason                      AS "referralReason"
        FROM appointments a
        JOIN person req ON req.per_id = a.req_id
        LEFT JOIN dependents dep ON dep.dep_id = a.app_patient_dependent_id
        LEFT JOIN requester_dependent rd ON rd.req_id = a.req_id AND rd.dep_id = a.app_patient_dependent_id
        LEFT JOIN relationship rel ON rel.rel_id = rd.rel_id
        LEFT JOIN person psy_per ON psy_per.per_id = a.psy_id
        LEFT JOIN person sec_per ON sec_per.per_id = a.sec_id
        LEFT JOIN appointments ref_app ON ref_app.app_id = a.app_referred_from_app_id
        LEFT JOIN person ref_by_per ON ref_by_per.per_id = ref_app.psy_id
        LEFT JOIN person ref_to_per ON ref_to_per.per_id = a.app_referred_to_psy_id
        WHERE a.app_referred_from_app_id IS NOT NULL
          AND a.app_state = $1
        ORDER BY a.app_created_at ASC`,
      [state],
    );
  }

  /**
   * Refers a valuation appointment to another psychologist in a single transaction:
   * 1. Marks the current valuation appointment as 'realizada' (if 'confirmada') and records
   *    app_referred_to_psy_id and app_referral_reason.
   * 2. Creates a new valuation appointment in state 'remitida' assigned to targetPsychologistId,
   *    with app_date = NULL (awaiting secretary assignment) and app_referred_from_app_id = sourceAppId.
   */
  async createReferral(params: {
    sourceAppId: number;
    psychologistId: number;
    targetPsychologistId: number;
    reason: string | null;
  }): Promise<{ sourceAppId: number; referredAppId: number }> {
    return this.dataSource.transaction(async (manager) => {
      const rows = await manager.query<{
        app_id: number;
        app_state: string;
        app_kind: string;
        app_type: string;
        app_reason: string | null;
        psy_id: number | null;
        req_id: number;
        app_patient_person_id: number | null;
        app_patient_dependent_id: number | null;
        app_referred_to_psy_id: number | null;
      }[]>(
        `SELECT
    app_id,
      app_state,
      app_kind,
      app_type,
      app_reason,
      psy_id,
      req_id,
      app_patient_person_id,
      app_patient_dependent_id,
      app_referred_to_psy_id
         FROM appointments
         WHERE app_id = $1
         FOR UPDATE`,
        [params.sourceAppId],
      );

      const source = rows[0];
      if (!source) {
        throw new Error('APPOINTMENT_NOT_FOUND');
      }
      if (source.psy_id !== params.psychologistId) {
        throw new Error('NOT_ASSIGNED_PSYCHOLOGIST');
      }
      if (source.app_kind !== 'valoracion') {
        throw new Error('ASSESSMENT_REQUIRED');
      }
      if (!['confirmada', 'realizada'].includes(source.app_state)) {
        throw new Error('INVALID_APPOINTMENT_STATE');
      }
      if (source.app_referred_to_psy_id !== null) {
        throw new Error('APPOINTMENT_ALREADY_REFERRED');
      }

      const existingReferredChild = await manager.query<{ app_id: number }[]>(
        `SELECT app_id FROM appointments WHERE app_referred_from_app_id = $1 LIMIT 1`,
        [params.sourceAppId],
      );
      if (existingReferredChild.length > 0) {
        throw new Error('APPOINTMENT_ALREADY_REFERRED');
      }

      const existingPackage = await manager.query<{ cp_id: number }[]>(
        `SELECT cp_id FROM care_packages WHERE cp_assessment_app_id = $1 LIMIT 1`,
        [params.sourceAppId],
      );
      if (existingPackage.length > 0) {
        throw new Error('PACKAGE_ALREADY_EXISTS_FOR_ASSESSMENT');
      }

      const activePackage = await manager.query<{ cp_id: number }[]>(
        `SELECT cp_id FROM care_packages
         WHERE cp_state = 'activo'
    AND((cp_patient_person_id IS NOT NULL AND cp_patient_person_id = $1)
    OR(cp_patient_dependent_id IS NOT NULL AND cp_patient_dependent_id = $2))
         LIMIT 1`,
        [source.app_patient_person_id, source.app_patient_dependent_id],
      );
      if (activePackage.length > 0) {
        throw new Error('ACTIVE_CARE_PACKAGE_EXISTS');
      }

      if (source.req_id === params.targetPsychologistId) {
        throw new Error('PSYCHOLOGIST_CANNOT_ATTEND_OWN_APPOINTMENT');
      }

      const chainPsychologistIds = await this.findReferralChainPsychologistIds(
        params.sourceAppId,
        manager,
      );
      if (chainPsychologistIds.includes(params.targetPsychologistId)) {
        throw new Error('REFERRAL_LOOP_DETECTED');
      }

      await manager.query(
        `UPDATE appointments
         SET app_state = 'realizada',
      app_referred_to_psy_id = $1,
      app_referral_reason = $2
         WHERE app_id = $3`,
        [params.targetPsychologistId, params.reason, params.sourceAppId],
      );

      const created = await manager.query<{ app_id: number }[]>(
        `INSERT INTO appointments(
        req_id,
        app_patient_person_id,
        app_patient_dependent_id,
        psy_id,
        sec_id,
        app_date,
        app_duration,
        app_state,
        app_kind,
        app_type,
        app_reason,
        app_referred_from_app_id,
        app_referral_reason,
        app_created_at
      )
    VALUES($1, $2, $3, $4, NULL, NULL, NULL, 'remitida', 'valoracion', $5, $6, $7, $8, now())
         RETURNING app_id`,
        [
          source.req_id,
          source.app_patient_person_id,
          source.app_patient_dependent_id,
          params.targetPsychologistId,
          source.app_type,
          source.app_reason,
          params.sourceAppId,
          params.reason,
        ],
      );

      return {
        sourceAppId: params.sourceAppId,
        referredAppId: created[0].app_id,
      };
    });
  }
}

interface RawDependentEligibilityRow {
  depId: number;
  name: string;
  identityDocument: string;
  birthdate: string;
  gender: string | null;
  relationshipId: number | null;
  relationshipDescription: string | null;
  assignedAt: Date | string;
  priorAppointmentsCount: number | string;
  hasOpenValuation: boolean;
  carePackageState: 'activo' | 'sugerido' | 'finalizado' | null;
}

/**
 * Computes valuation eligibility metadata for a dependent row returned by SQL.
 * @param row Raw SQL projection for a registered dependent.
 * @returns Normalized dependent record with authoritative eligibility flags.
 */
function mapRequesterDependentRow(
  row: RawDependentEligibilityRow,
): RequesterDependentRow {
  const birthdate = row.birthdate.slice(0, 10);
  const isMinor = calculateAge(birthdate) < 18;
  const priorAppointmentsCount = Number(row.priorAppointmentsCount ?? 0);
  const hasPriorAppointments = priorAppointmentsCount > 0;
  const hasOpenValuation = Boolean(row.hasOpenValuation);
  const carePackageState = row.carePackageState ?? null;

  let blockingReason: DependentBlockingReason | null = null;
  if (!isMinor) {
    blockingReason = 'DEPENDENT_MUST_BE_MINOR';
  } else if (carePackageState === 'activo') {
    blockingReason = 'ACTIVE_CARE_PACKAGE_EXISTS';
  } else if (carePackageState === 'sugerido') {
    blockingReason = 'SUGGESTED_CARE_PACKAGE_PENDING';
  } else if (carePackageState === 'finalizado') {
    blockingReason = 'FOLLOW_UP_VALUATION_REQUIRED_WITH_TREATING_PSYCHOLOGIST';
  } else if (hasOpenValuation) {
    blockingReason = 'VALUATION_ALREADY_IN_PROGRESS';
  }

  const canRequestValuation = blockingReason === null;
  const canSelectFirstSlot = canRequestValuation && !hasPriorAppointments;

  return {
    depId: Number(row.depId),
    name: row.name,
    identityDocument: String(row.identityDocument),
    birthdate,
    gender: row.gender,
    relationshipId: row.relationshipId !== null ? Number(row.relationshipId) : null,
    relationshipDescription: row.relationshipDescription,
    assignedAt:
      row.assignedAt instanceof Date
        ? row.assignedAt.toISOString()
        : String(row.assignedAt),
    eligibility: {
      isMinor,
      hasPriorAppointments,
      hasOpenValuation,
      carePackageState,
      canRequestValuation,
      canSelectFirstSlot,
      blockingReason,
    },
  };
}

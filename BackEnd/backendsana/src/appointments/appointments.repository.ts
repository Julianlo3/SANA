import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { CURRENT_POLICY_VERSION } from '../config/policy.config.js';

type QueryExecutor = DataSource | EntityManager;

export interface AppointmentRequesterParams {
  name: string;
  cardType: string;
  identityDocument: number;
  contactNumber: string;
  email?: string;
  birthdate?: string;
  gender?: string;
  termsAccepted: boolean;
}

export interface AppointmentDependentParams {
  name: string;
  identityDocument: number;
  birthdate: string;
  gender?: string;
  contactNumber?: string;
  termsAccepted: boolean;
}

export interface AppointmentRow {
  appId: number;
  appState: string;
  appType: string;
  appDate: string | null;
  appDateIdeal: string | null;
  appDuration: number | null;
  appDiscardReason: string | null;
  appCreatedAt: string;
  requesterId: number;
  requesterName: string;
  requesterCardType: string | null;
  requesterIdentityDocument: number | null;
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

/** 
 * Repository for the appointments table and related entities.
 */
@Injectable()
export class AppointmentsRepository {
  constructor(private readonly dataSource: DataSource) { }

  /**
   * finds all appointments with optional state filter
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
          a.app_type                                 AS "appType",
          a.app_date                                 AS "appDate",
          a.app_date_ideal                           AS "appDateIdeal",
          a.app_duration                             AS "appDuration",
          a.app_discard_reason                       AS "appDiscardReason",
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
          rel.rel_description                        AS "relationshipDescription"
        FROM appointments a
        JOIN person req ON req.per_id = a.req_id
        LEFT JOIN dependents dep ON dep.dep_id = a.app_patient_dependent_id
        LEFT JOIN requester_dependent rd ON rd.req_id = a.req_id AND rd.dep_id = a.app_patient_dependent_id
        LEFT JOIN relationship rel ON rel.rel_id = rd.rel_id
        LEFT JOIN person psy_per ON psy_per.per_id = a.psy_id
        LEFT JOIN person sec_per ON sec_per.per_id = a.sec_id
        ${whereClause}
        ORDER BY a.app_created_at DESC`,
      params,
    );
  }

  /**
   * finds an appointment by id
   * @param appId appointment id
   * @returns appointment or null
   */
  async findById(appId: number): Promise<AppointmentRow | null> {
    const rows = await this.dataSource.query<AppointmentRow[]>(
      `SELECT
          a.app_id                                   AS "appId",
          a.app_state                                AS "appState",
          a.app_type                                 AS "appType",
          a.app_date                                 AS "appDate",
          a.app_date_ideal                           AS "appDateIdeal",
          a.app_duration                             AS "appDuration",
          a.app_discard_reason                       AS "appDiscardReason",
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
          rel.rel_description                        AS "relationshipDescription"
        FROM appointments a
        JOIN person req ON req.per_id = a.req_id
        LEFT JOIN dependents dep ON dep.dep_id = a.app_patient_dependent_id
        LEFT JOIN requester_dependent rd ON rd.req_id = a.req_id AND rd.dep_id = a.app_patient_dependent_id
        LEFT JOIN relationship rel ON rel.rel_id = rd.rel_id
        LEFT JOIN person psy_per ON psy_per.per_id = a.psy_id
        LEFT JOIN person sec_per ON sec_per.per_id = a.sec_id
        WHERE a.app_id = $1`,
      [appId],
    );
    return rows[0] ?? null;
  }

  async createRequest(params: {
    requester: AppointmentRequesterParams;
    dependent: (AppointmentDependentParams & { relationshipId: number }) | null;
    appType: string;
    appReason: string | null;
    appDateIdeal: string | null;
  }): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      const requesterId = await this.upsertRequester(params.requester, manager);
      let patientPersonId: number | null = requesterId;
      let patientDependentId: number | null = null;

      if (params.dependent) {
        patientPersonId = null;
        patientDependentId = await this.upsertDependent(params.dependent, manager);
        await this.linkRequesterDependent(
          requesterId,
          patientDependentId,
          params.dependent.relationshipId,
          manager,
        );
      }

      return this.create(
        {
          requesterId,
          patientPersonId,
          patientDependentId,
          appType: params.appType,
          appReason: params.appReason,
          appDateIdeal: params.appDateIdeal,
        },
        manager,
      );
    });
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
    const existing = await executor.query<{ per_id: number }[]>(
      `SELECT per_id FROM person WHERE per_identity_document = $1`,
      [params.identityDocument],
    );

    let personId: number;

    if (existing[0]) {
      personId = existing[0].per_id;
      await executor.query(
        `UPDATE person
             SET per_termns_accpted = COALESCE(per_termns_accpted, false) OR $1,
               per_policy_accepted_at = CASE WHEN $1 THEN now() ELSE per_policy_accepted_at END,
               per_policy_version = CASE WHEN $1 THEN $3 ELSE per_policy_version END,
               per_update_date = now()
               WHERE per_id = $2`,
            [params.termsAccepted, personId, CURRENT_POLICY_VERSION],
      );
    } else {
      const email = params.email || `doc_${params.identityDocument}@sana.org`;
      const created = await executor.query<{ per_id: number }[]>(
        `INSERT INTO person (
           per_name, per_card_type, per_identity_document, per_contact_number,
           per_email, per_birthdate, per_gender, per_termns_accpted,
           per_policy_accepted_at, per_policy_version, per_state
         )
         VALUES ($1, $2, $3, $4, $5, $6::date, $7, $8,
                 CASE WHEN $8 THEN now() ELSE NULL END,
                 CASE WHEN $8 THEN $9 ELSE NULL END,
                 'activo')
         RETURNING per_id`,
        [
          params.name,
          params.cardType,
          params.identityDocument,
          params.contactNumber,
          email,
          params.birthdate ?? null,
          params.gender ?? null,
          params.termsAccepted,
          CURRENT_POLICY_VERSION,
        ],
      );
      personId = created[0].per_id;
    }

    // Asegurar que tenga el rol 'consultante' (rol_id = 3)
    await executor.query(
      `INSERT INTO person_rol (per_id, rol_id, pr_assigned_at)
       VALUES ($1, 3, now())
       ON CONFLICT (per_id, rol_id) DO NOTHING`,
      [personId],
    );

    return personId;
  }

  /**
   * insert or update dependent
   * @param params contains name, identityDocument, birthdate, gender, contactNumber, termsAccepted
   * @returns dep_id or null 
   */
  async upsertDependent(
    params: AppointmentDependentParams,
    executor: QueryExecutor = this.dataSource,
  ): Promise<number> {
    const existing = await executor.query<{ dep_id: number }[]>(
      `SELECT dep_id FROM dependents WHERE dep_identity_document = $1`,
      [params.identityDocument],
    );

    const contact = params.contactNumber ? Number(params.contactNumber) : 0;

    if (existing[0]) {
      const depId = existing[0].dep_id;
      await executor.query(
        `UPDATE dependents
             SET dep_termns_accpted = COALESCE(dep_termns_accpted, false) OR $1,
               dep_policy_accepted_at = CASE WHEN $1 THEN now() ELSE dep_policy_accepted_at END,
               dep_policy_version = CASE WHEN $1 THEN $2 ELSE dep_policy_version END
         WHERE dep_id = $3`,
        [params.termsAccepted, CURRENT_POLICY_VERSION, depId],
      );
      return depId;
    }

    const created = await executor.query<{ dep_id: number }[]>(
      `INSERT INTO dependents (
         dep_name, dep_identity_document, dep_birthdate, dep_contact_number, dep_gender,
         dep_termns_accpted, dep_policy_accepted_at, dep_policy_version
       )
       VALUES ($1, $2, $3::date, $4, $5, $6,
               CASE WHEN $6 THEN now() ELSE NULL END,
               CASE WHEN $6 THEN $7 ELSE NULL END)
       RETURNING dep_id`,
      [
        params.name,
        params.identityDocument,
        params.birthdate,
        contact,
        params.gender ?? null,
        params.termsAccepted,
        CURRENT_POLICY_VERSION,
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
   * insert appointment in 'pendiente' state
   * @param params contains requesterId, patientPersonId, patientDependentId, appType, appReason, appDateIdeal
   * @returns app_id or null
   */
  async create(params: {
    requesterId: number;
    patientPersonId: number | null;
    patientDependentId: number | null;
    appType: string;
    appReason: string | null;
    appDateIdeal: string | null;
  }, executor: QueryExecutor = this.dataSource): Promise<number> {
    const result = await executor.query<{ app_id: number }[]>(
      `INSERT INTO appointments (
         req_id, app_patient_person_id, app_patient_dependent_id,
         app_state, app_type, app_reason, app_date_ideal, app_created_at
       )
       VALUES ($1, $2, $3, 'pendiente', $4, $5, $6::timestamptz, now())
       RETURNING app_id`,
      [
        params.requesterId,
        params.patientPersonId,
        params.patientDependentId,
        params.appType,
        params.appReason,
        params.appDateIdeal,
      ],
    );
    return result[0].app_id;
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
   * update state of an appointment (cancelada / realizada)
   * @param appId appointment id
   * @param state new state
   * @returns void
   */
  async updateState(appId: number, state: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE appointments SET app_state = $1 WHERE app_id = $2`,
      [state, appId],
    );
  }

  /**
   * discards an appointment with a given reason
   * @param appId appointment id
   * @param reason reason for discarding
   * @returns void
   */
  async discard(appId: number, reason: string): Promise<void> {
    const result = await this.dataSource.query(
      `UPDATE appointments
       SET app_state = 'descartada', app_discard_reason = $1
       WHERE app_id = $2 AND app_state IN ('pendiente', 'asignada')`,
      [reason, appId],
    );
    if (result?.rowCount === 0) throw new Error('APPOINTMENT_NOT_DISCARDABLE');
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
}

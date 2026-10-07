import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

type QueryExecutor = DataSource | EntityManager;

export interface AppointmentRequesterParams {
  name: string;
  cardType: string;
  identityDocument: string;
  contactNumber: string;
  email?: string;
  birthdate?: string;
  gender?: string;
  termsAccepted: boolean;
  residenceZone?: string | null;
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
}

export interface RequesterAppointmentRow {
  appId: number;
  appState: string;
  appType: string;
  appDate: string | null;
  appDuration: number | null;
  appCreatedAt: string;
  patientType: 'self' | 'dependent';
  patientName: string;
  psychologistName: string | null;
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
   * Finds appointments requested by a specific requester.
   * @param requesterId The ID of the requester.
   * @returns A promise resolving to the list of requested appointments.
   */
  findByRequester(requesterId: number): Promise<RequesterAppointmentRow[]> {
    return this.dataSource.query<RequesterAppointmentRow[]>(
      `SELECT
          a.app_id AS "appId",
          a.app_state AS "appState",
          a.app_type AS "appType",
          a.app_date AS "appDate",
          a.app_duration AS "appDuration",
          a.app_created_at AS "appCreatedAt",
          CASE
            WHEN a.app_patient_dependent_id IS NOT NULL THEN 'dependent'
            ELSE 'self'
          END AS "patientType",
          COALESCE(dep.dep_name, req.per_name) AS "patientName",
          psy.per_name AS "psychologistName"
        FROM appointments a
        JOIN person req ON req.per_id = a.req_id
        LEFT JOIN dependents dep ON dep.dep_id = a.app_patient_dependent_id
        LEFT JOIN person psy ON psy.per_id = a.psy_id
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
          rel.rel_description                        AS "relationshipDescription"
        FROM appointments a
        JOIN person req ON req.per_id = a.req_id
        LEFT JOIN dependents dep ON dep.dep_id = a.app_patient_dependent_id
        LEFT JOIN requester_dependent rd ON rd.req_id = a.req_id AND rd.dep_id = a.app_patient_dependent_id
        LEFT JOIN relationship rel ON rel.rel_id = rd.rel_id
        LEFT JOIN person psy_per ON psy_per.per_id = a.psy_id
        LEFT JOIN person sec_per ON sec_per.per_id = a.sec_id
        ${whereClause}
        ORDER BY a.app_date ASC`,
      params,
    );
  }

  async createRequest(params: {
    requester: AppointmentRequesterParams;
    dependent: (AppointmentDependentParams & { relationshipId: number }) | null;
    appType: string;
    appReason: string | null;
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

      const appId = await this.create(
        {
          requesterId,
          patientPersonId,
          patientDependentId,
          appType: params.appType,
          appReason: params.appReason,
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
        manager,
      );

      return appId;
    });
  }

  /**
   * Records policy acceptances for the appointment request.
   * @param appId The appointment ID.
   * @param requesterId The requester (person) ID.
   * @param dependentId Optional dependent ID.
   * @param requesterTermsAccepted Whether the requester accepted terms.
   * @param dependentTermsAccepted Whether the dependent terms were accepted.
   * @param executor The query executor.
   */
  private async recordPolicyAcceptances(
    appId: number,
    requesterId: number,
    dependentId: number | null,
    requesterTermsAccepted: boolean,
    dependentTermsAccepted: boolean | undefined,
    executor: QueryExecutor,
  ): Promise<void> {
    // Get current policy document IDs
    const dataTreatmentPdId = await this.getCurrentPolicyDocumentId('data_treatment', executor);
    const dependentConsentPdId = await this.getCurrentPolicyDocumentId('dependent_consent', executor);

    if (requesterTermsAccepted && dataTreatmentPdId) {
      await executor.query(
        `INSERT INTO policy_acceptance (per_id, pd_id, app_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (app_id, pd_id) WHERE app_id IS NOT NULL DO NOTHING`,
        [requesterId, dataTreatmentPdId, appId],
      );
    }

    if (dependentId && dependentTermsAccepted && dependentConsentPdId) {
      await executor.query(
        `INSERT INTO policy_acceptance (per_id, dep_id, pd_id, app_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (app_id, pd_id) WHERE app_id IS NOT NULL DO NOTHING`,
        [requesterId, dependentId, dependentConsentPdId, appId],
      );
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
    const existing = await executor.query<{ per_id: number }[]>(
      `SELECT per_id FROM person WHERE per_identity_document = $1`,
      [params.identityDocument],
    );

    let personId: number;

    if (existing[0]) {
      personId = existing[0].per_id;
      await executor.query(
        `UPDATE person
             SET per_residence_zone = COALESCE($2, per_residence_zone),
               per_update_date = now()
               WHERE per_id = $1`,
        [personId, params.residenceZone],
      );
    } else {
      const email = params.email || `doc_${params.identityDocument}@sana.org`;
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

    if (existing[0]) {
      return existing[0].dep_id;
    }

    const created = await executor.query<{ dep_id: number }[]>(
      `INSERT INTO dependents (
         dep_name, dep_identity_document, dep_birthdate, dep_gender
       )
       VALUES ($1, $2, $3::date, $4)
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
   * insert appointment in 'pendiente' state
   * @param params contains requesterId, patientPersonId, patientDependentId, appType, appReason
   * @returns app_id or null
   */
  async create(params: {
    requesterId: number;
    patientPersonId: number | null;
    patientDependentId: number | null;
    appType: string;
    appReason: string | null;
  }, executor: QueryExecutor = this.dataSource): Promise<number> {
    const result = await executor.query<{ app_id: number }[]>(
      `INSERT INTO appointments (
         req_id, app_patient_person_id, app_patient_dependent_id,
         app_state, app_type, app_reason, app_created_at
       )
       VALUES ($1, $2, $3, 'pendiente', $4, $5, now())
       RETURNING app_id`,
      [
        params.requesterId,
        params.patientPersonId,
        params.patientDependentId,
        params.appType,
        params.appReason,
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
   * update state of an appointment
   * @param appId appointment id
   * @param state new state
   * @returns void
   */
  updateState(
    appId: number,
    state: 'cancelada' | 'realizada',
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

      if (state === 'cancelada') {
        await manager.query(
          `DELETE FROM schedule_occupancy WHERE app_id = $1`,
          [appId],
        );
      }

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
         WHERE app_id = $2 AND app_state IN ('pendiente', 'asignada')`,
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
   * finds active secretary emails for notifications
   * @returns array of secretary emails
   */
  async findActiveSecretaryEmails(): Promise<string[]> {
    const rows = await this.dataSource.query<{ email: string }[]>(
      `SELECT DISTINCT person.per_email AS email
       FROM person
       JOIN person_rol ON person_rol.per_id = person.per_id
       JOIN rol ON rol.rol_id = person_rol.rol_id
       WHERE person.per_state = 'activo'
         AND person_rol.pr_active = true
         AND rol.rol_description = 'secretario'
       ORDER BY person.per_email`,
    );
    return rows.map((row) => row.email);
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
       VALUES ($1, $2, $3, $4, $5)`,
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

}

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ScheduleService } from '../schedule/schedule.service.js';
import {
  MAX_CARE_PACKAGE_SESSIONS,
  MIN_CARE_PACKAGE_SESSIONS,
  type ApproveCarePackageDto,
  type CarePackageAvailabilityQueryDto,
  type CloseCarePackageDto,
  type CreateCarePackageDto,
  type RejectCarePackageDto,
  type ScheduleFollowUpValuationDto,
  type SchedulePackageAppointmentDto,
  type SuggestCarePackageDto,
} from './dto/care-package.dto.js';

@Injectable()
export class CarePackagesService {
  constructor(
    private readonly db: DataSource,
    private readonly schedule: ScheduleService,
  ) { }

  private validateSessionLimit(sessionLimit: number): void {
    if (
      !Number.isInteger(sessionLimit) ||
      sessionLimit < MIN_CARE_PACKAGE_SESSIONS ||
      sessionLimit > MAX_CARE_PACKAGE_SESSIONS
    ) {
      throw new BadRequestException({
        error: 'INVALID_SESSION_LIMIT',
        message: `El número de sesiones del paquete debe ser entre ${MIN_CARE_PACKAGE_SESSIONS} y ${MAX_CARE_PACKAGE_SESSIONS}`,
      });
    }
  }

  /**
   * Psychologist suggests a care package after a valuation appointment.
   */
  async suggest(dto: SuggestCarePackageDto, psychologistId: number) {
    this.validateSessionLimit(dto.sessionLimit);
    return this.db.transaction(async (m) => {
      const a = (
        await m.query<any[]>(
          `SELECT app_id, app_state, app_kind, psy_id, app_patient_person_id, app_patient_dependent_id, app_referred_to_psy_id
           FROM appointments
           WHERE app_id = $1
           FOR UPDATE`,
          [dto.assessmentAppointmentId],
        )
      )[0];

      if (!a) throw new NotFoundException('La valoración no existe');

      if (a.psy_id !== psychologistId) {
        throw new ForbiddenException({
          error: 'NOT_ASSIGNED_PSYCHOLOGIST',
          message: 'Solo el psicólogo asignado a la valoración puede sugerir un paquete',
        });
      }

      if (a.app_kind !== 'valoracion') {
        throw new BadRequestException({
          error: 'ASSESSMENT_REQUIRED',
          message: 'Solo se pueden sugerir paquetes a partir de una cita de valoración',
        });
      }

      if (a.app_referred_to_psy_id) {
        throw new ConflictException({
          error: 'ASSESSMENT_ALREADY_REFERRED',
          message: 'Esta valoración fue remitida a otro psicólogo. El paquete solo puede sugerirse desde la nueva valoración remitida.',
        });
      }

      if (a.app_state === 'confirmada') {
        await m.query(
          `UPDATE appointments SET app_state = 'realizada' WHERE app_id = $1`,
          [a.app_id],
        );
      } else if (a.app_state !== 'realizada') {
        throw new BadRequestException({
          error: 'INVALID_APPOINTMENT_STATE',
          message: 'La valoración debe estar confirmada o realizada para sugerir un paquete',
        });
      }

      const existingSuggestion = await m.query<any[]>(
        `SELECT cp_id FROM care_packages WHERE cp_assessment_app_id = $1`,
        [a.app_id],
      );
      if (existingSuggestion.length) {
        throw new ConflictException({
          error: 'PACKAGE_ALREADY_EXISTS',
          message: 'Ya existe un paquete o sugerencia registrada para esta valoración',
        });
      }

      const active = await m.query<any[]>(
        `SELECT cp_id FROM care_packages
         WHERE cp_state = 'activo'
           AND((cp_patient_person_id IS NOT NULL AND cp_patient_person_id = $1)
             OR(cp_patient_dependent_id IS NOT NULL AND cp_patient_dependent_id = $2))
         FOR UPDATE`,
        [a.app_patient_person_id, a.app_patient_dependent_id],
      );
      if (active.length) {
        throw new ConflictException({
          error: 'ACTIVE_CARE_PACKAGE_EXISTS',
          message: 'El paciente ya cuenta con un paquete activo',
        });
      }

      const rows = await m.query<any[]>(
        `INSERT INTO care_packages(
            cp_patient_person_id,
            cp_patient_dependent_id,
            cp_assessment_app_id,
            psy_id,
            sec_id,
            cp_session_limit,
            cp_priority,
            cp_state,
            cp_suggestion_comment,
            cp_suggested_session_limit,
            cp_suggested_priority
          ) VALUES($1, $2, $3, $4, NULL, $5, $6, 'sugerido', $7, $5, $6)
      RETURNING
           cp_id AS "id",
        cp_state AS state,
          cp_session_limit AS "sessionLimit",
            cp_priority AS priority,
              psy_id AS "psychologistId",
                cp_suggestion_comment AS "suggestionComment",
                  cp_created_at AS "createdAt"`,
        [
          a.app_patient_person_id,
          a.app_patient_dependent_id,
          a.app_id,
          a.psy_id,
          dto.sessionLimit,
          dto.priority,
          dto.comment?.trim() ?? null,
        ],
      );

      return rows[0];
    });
  }

  /**
   * Secretary views all pending suggestions.
   */
  async findSuggestions() {
    return this.db.query<any[]>(
      `SELECT
      cp.cp_id AS "id",
        cp.cp_state AS state,
          cp.cp_session_limit AS "sessionLimit",
            cp.cp_priority AS priority,
              cp.cp_suggested_session_limit AS "suggestedSessionLimit",
                cp.cp_suggested_priority AS "suggestedPriority",
                  cp.cp_suggestion_comment AS "suggestionComment",
                    cp.cp_created_at AS "createdAt",
                      cp.cp_assessment_app_id AS "assessmentAppointmentId",
                        assessment.app_date AS "assessmentDate",
                          cp.psy_id AS "psychologistId",
                            psy.per_name AS "psychologistName",
                              CASE WHEN cp.cp_patient_dependent_id IS NOT NULL THEN 'dependent' ELSE 'self' END AS "patientType",
                                COALESCE(dep.dep_name, patient.per_name) AS "patientName",
                                  COALESCE(dep.dep_id, patient.per_id) AS "patientId",
                                    (
                                      SELECT COUNT(*):: int
           FROM appointments noshow
      WHERE((noshow.app_patient_person_id IS NOT NULL AND noshow.app_patient_person_id = cp.cp_patient_person_id)
      OR(noshow.app_patient_dependent_id IS NOT NULL AND noshow.app_patient_dependent_id = cp.cp_patient_dependent_id))
             AND noshow.app_state = 'no_asistio'
         ) AS "noShowCount"
       FROM care_packages cp
       JOIN appointments assessment ON assessment.app_id = cp.cp_assessment_app_id
       LEFT JOIN person patient ON patient.per_id = cp.cp_patient_person_id
       LEFT JOIN dependents dep ON dep.dep_id = cp.cp_patient_dependent_id
       LEFT JOIN person psy ON psy.per_id = cp.psy_id
       WHERE cp.cp_state = 'sugerido'
       ORDER BY
         CASE cp.cp_priority
           WHEN 'alta' THEN 1
           WHEN 'media' THEN 2
           WHEN 'baja' THEN 3
           ELSE 4
    END,
      cp.cp_created_at ASC`,
    );
  }

  /**
   * Secretary approves a suggested package, optionally modifying sessions or priority.
   */
  async approve(id: number, dto: ApproveCarePackageDto, secretaryId: number) {
    return this.db.transaction(async (m) => {
      const p = (
        await m.query<any[]>(
          `SELECT * FROM care_packages WHERE cp_id = $1 FOR UPDATE`,
          [id],
        )
      )[0];
      if (!p) throw new NotFoundException('Paquete no encontrado');
      if (p.cp_state !== 'sugerido') {
        throw new BadRequestException('Solo se pueden aprobar paquetes en estado sugerido');
      }

      const active = await m.query<any[]>(
        `SELECT cp_id FROM care_packages
         WHERE cp_state = 'activo'
           AND cp_id != $1
    AND((cp_patient_person_id IS NOT NULL AND cp_patient_person_id = $2)
    OR(cp_patient_dependent_id IS NOT NULL AND cp_patient_dependent_id = $3))
         FOR UPDATE`,
        [id, p.cp_patient_person_id, p.cp_patient_dependent_id],
      );
      if (active.length) {
        throw new ConflictException({
          error: 'ACTIVE_CARE_PACKAGE_EXISTS',
          message: 'El paciente ya cuenta con un paquete activo',
        });
      }

      const newSessionLimit = Number(dto.sessionLimit ?? p.cp_session_limit);
      this.validateSessionLimit(newSessionLimit);
      const newPriority = dto.priority ?? p.cp_priority;

      await m.query(
        `UPDATE care_packages
         SET cp_state = 'activo',
      sec_id = $1,
      cp_session_limit = $2,
      cp_priority = $3,
      cp_reviewed_at = now()
         WHERE cp_id = $4`,
        [secretaryId, newSessionLimit, newPriority, id],
      );

      return this.find(id);
    });
  }

  /**
   * Secretary rejects a suggested package with a mandatory reason.
   */
  async reject(id: number, dto: RejectCarePackageDto, secretaryId: number) {
    return this.db.transaction(async (m) => {
      const p = (
        await m.query<any[]>(
          `SELECT * FROM care_packages WHERE cp_id = $1 FOR UPDATE`,
          [id],
        )
      )[0];
      if (!p) throw new NotFoundException('Paquete no encontrado');
      if (p.cp_state !== 'sugerido') {
        throw new BadRequestException('Solo se pueden rechazar paquetes en estado sugerido');
      }

      await m.query(
        `UPDATE care_packages
         SET cp_state = 'rechazado',
      sec_id = $1,
      cp_rejection_reason = $2,
      cp_reviewed_at = now()
         WHERE cp_id = $3`,
        [secretaryId, dto.reason.trim(), id],
      );

      return this.find(id);
    });
  }

  /**
   * Direct package creation by secretary (approved immediately).
   */
  async create(dto: CreateCarePackageDto, secretaryId: number) {
    this.validateSessionLimit(dto.sessionLimit);
    return this.db.transaction(async (m) => {
      const a = (
        await m.query<any[]>(
      `SELECT app_id, app_state, app_kind, psy_id, app_patient_person_id, app_patient_dependent_id, app_referred_to_psy_id
           FROM appointments
           WHERE app_id = $1
           FOR UPDATE`,
      [dto.assessmentAppointmentId],
        )
      )[0];
    if (!a) throw new NotFoundException('La valoración no existe');
    if (a.app_kind !== 'valoracion' || a.app_state !== 'realizada' || !a.psy_id) {
      throw new BadRequestException({
        error: 'ASSESSMENT_REQUIRED',
        message: 'El paquete requiere una valoración realizada con psicólogo',
      });
    }
    if (a.app_referred_to_psy_id) {
      throw new ConflictException({
        error: 'ASSESSMENT_ALREADY_REFERRED',
        message: 'Esta valoración fue remitida a otro psicólogo. El paquete debe crearse a partir de la valoración del nuevo psicólogo.',
      });
    }
    const active = await m.query<any[]>(
      `SELECT cp_id FROM care_packages
         WHERE cp_state = 'activo'
           AND ((cp_patient_person_id IS NOT NULL AND cp_patient_person_id = $1)
             OR (cp_patient_dependent_id IS NOT NULL AND cp_patient_dependent_id = $2))
         FOR UPDATE`,
      [a.app_patient_person_id, a.app_patient_dependent_id],
    );
    if (active.length) {
      throw new ConflictException({
        error: 'ACTIVE_CARE_PACKAGE_EXISTS',
        message: 'El paciente ya tiene un paquete activo',
      });
    }
    const rows = await m.query<any[]>(
      `INSERT INTO care_packages(
           cp_patient_person_id,
           cp_patient_dependent_id,
           cp_assessment_app_id,
           psy_id,
           sec_id,
           cp_session_limit,
           cp_priority,
           cp_state,
           cp_suggestion_comment,
           cp_suggested_session_limit,
           cp_suggested_priority,
           cp_reviewed_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'activo', $8, $6, $7, now())
         RETURNING
           cp_id AS "id",
           cp_state AS state,
           cp_session_limit AS "sessionLimit",
           cp_priority AS priority,
           psy_id AS "psychologistId"`,
      [
        a.app_patient_person_id,
        a.app_patient_dependent_id,
        a.app_id,
        a.psy_id,
        secretaryId,
        dto.sessionLimit,
        dto.priority,
        dto.comment?.trim() ?? null,
      ],
    );
    return rows[0];
  });
}

  /**
   * Lists packages for secretary management view, filterable by state.
   */
  async findAll(state ?: string) {
  const params: any[] = [];
  let stateFilter = '';
  if (state) {
    params.push(state);
    stateFilter = `WHERE cp.cp_state = $1`;
  }

  return this.db.query<any[]>(
    `SELECT
         cp.cp_id AS "id",
         cp.cp_state AS state,
         cp.cp_session_limit AS "sessionLimit",
         cp.cp_priority AS priority,
         cp.cp_suggestion_comment AS "suggestionComment",
         cp.cp_rejection_reason AS "rejectionReason",
         cp.cp_created_at AS "createdAt",
         cp.cp_reviewed_at AS "reviewedAt",
         cp.cp_closed_at AS "closedAt",
         cp.cp_close_reason AS "closeReason",
         cp.psy_id AS "psychologistId",
         psy.per_name AS "psychologistName",
         CASE WHEN cp.cp_patient_dependent_id IS NOT NULL THEN 'dependent' ELSE 'self' END AS "patientType",
         COALESCE(dep.dep_name, patient.per_name) AS "patientName",
         COALESCE(dep.dep_id, patient.per_id) AS "patientId",
         COUNT(a.app_id) FILTER (WHERE a.app_state = 'realizada')::int AS "completedSessions",
         COUNT(a.app_id) FILTER (WHERE a.app_state IN ('asignada', 'confirmada'))::int AS "reservedSessions",
         (cp.cp_session_limit - (
           COUNT(a.app_id) FILTER (WHERE a.app_state IN ('realizada', 'asignada', 'confirmada'))::int
         )) AS "availableSessions",
         (
           SELECT COUNT(*)::int
           FROM appointments noshow
           WHERE ((noshow.app_patient_person_id IS NOT NULL AND noshow.app_patient_person_id = cp.cp_patient_person_id)
               OR (noshow.app_patient_dependent_id IS NOT NULL AND noshow.app_patient_dependent_id = cp.cp_patient_dependent_id))
             AND noshow.app_state = 'no_asistio'
         ) AS "noShowCount"
       FROM care_packages cp
       LEFT JOIN appointments assessment ON assessment.app_id = cp.cp_assessment_app_id
       LEFT JOIN person patient ON patient.per_id = cp.cp_patient_person_id
       LEFT JOIN dependents dep ON dep.dep_id = cp.cp_patient_dependent_id
       LEFT JOIN person psy ON psy.per_id = cp.psy_id
       LEFT JOIN appointments a ON a.cp_id = cp.cp_id
       ${stateFilter}
       GROUP BY
         cp.cp_id,
         psy.per_name,
         dep.dep_name,
         dep.dep_id,
         patient.per_name,
         patient.per_id
       ORDER BY
         CASE cp.cp_state
           WHEN 'sugerido' THEN 1
           WHEN 'activo' THEN 2
           ELSE 3
         END,
         cp.cp_created_at DESC`,
    params,
  );
}

  /**
   * Consultant queries their own packages (and their dependents').
   */
  async findMyPackages(requesterId: number) {
  return this.db.query<any[]>(
    `SELECT
         cp.cp_id AS "id",
         cp.cp_state AS state,
         cp.cp_session_limit AS "sessionLimit",
         cp.cp_priority AS priority,
         cp.cp_suggestion_comment AS "suggestionComment",
         cp.cp_created_at AS "createdAt",
         cp.cp_closed_at AS "closedAt",
         cp.cp_close_reason AS "closeReason",
         cp.psy_id AS "psychologistId",
         psy.per_name AS "psychologistName",
         CASE WHEN cp.cp_patient_dependent_id IS NOT NULL THEN 'dependent' ELSE 'self' END AS "patientType",
         COALESCE(dep.dep_name, patient.per_name) AS "patientName",
         COUNT(a.app_id) FILTER (WHERE a.app_state = 'realizada')::int AS "completedSessions",
         COUNT(a.app_id) FILTER (WHERE a.app_state IN ('asignada', 'confirmada'))::int AS "reservedSessions",
         (cp.cp_session_limit - (
           COUNT(a.app_id) FILTER (WHERE a.app_state IN ('realizada', 'asignada', 'confirmada'))::int
         )) AS "availableSessions",
         (
           SELECT COUNT(*)::int
           FROM appointments noshow
           WHERE ((noshow.app_patient_person_id IS NOT NULL AND noshow.app_patient_person_id = cp.cp_patient_person_id)
               OR (noshow.app_patient_dependent_id IS NOT NULL AND noshow.app_patient_dependent_id = cp.cp_patient_dependent_id))
             AND noshow.app_state = 'no_asistio'
         ) AS "noShowCount"
       FROM care_packages cp
       JOIN appointments assessment ON assessment.app_id = cp.cp_assessment_app_id
       LEFT JOIN person patient ON patient.per_id = cp.cp_patient_person_id
       LEFT JOIN dependents dep ON dep.dep_id = cp.cp_patient_dependent_id
       LEFT JOIN person psy ON psy.per_id = cp.psy_id
       LEFT JOIN appointments a ON a.cp_id = cp.cp_id
       LEFT JOIN requester_dependent rd ON rd.dep_id = cp.cp_patient_dependent_id
       WHERE assessment.req_id = $1 OR rd.req_id = $1
       GROUP BY cp.cp_id, psy.per_name, dep.dep_name, patient.per_name
       ORDER BY
         CASE cp.cp_state
           WHEN 'activo' THEN 1
           WHEN 'sugerido' THEN 2
           ELSE 3
         END,
         cp.cp_created_at DESC`,
    [requesterId],
  );
}

  /**
   * Retrieves single package details.
   */
  async find(
  id: number,
  actor ?: { requesterId?: number; psychologistId?: number; secretaryId?: number },
) {
  const rows = await this.db.query<any[]>(
    `SELECT
         cp.cp_id AS "id",
         cp.cp_state AS state,
         cp.cp_session_limit AS "sessionLimit",
         cp.cp_priority AS priority,
         cp.cp_suggestion_comment AS "suggestionComment",
         cp.cp_rejection_reason AS "rejectionReason",
         cp.cp_created_at AS "createdAt",
         cp.cp_reviewed_at AS "reviewedAt",
         cp.cp_closed_at AS "closedAt",
         cp.cp_close_reason AS "closeReason",
         cp.psy_id AS "psychologistId",
         psy.per_name AS "psychologistName",
         cp.cp_patient_person_id AS "patientPersonId",
         cp.cp_patient_dependent_id AS "patientDependentId",
         CASE WHEN cp.cp_patient_dependent_id IS NOT NULL THEN 'dependent' ELSE 'self' END AS "patientType",
         COALESCE(dep.dep_name, patient.per_name) AS "patientName",
         COUNT(a.app_id) FILTER (WHERE a.app_state = 'realizada')::int AS "completedSessions",
         COUNT(a.app_id) FILTER (WHERE a.app_state IN ('asignada', 'confirmada'))::int AS "reservedSessions",
         (cp.cp_session_limit - (
           COUNT(a.app_id) FILTER (WHERE a.app_state IN ('realizada', 'asignada', 'confirmada'))::int
         )) AS "availableSessions",
         (
           SELECT COUNT(*)::int
           FROM appointments noshow
           WHERE ((noshow.app_patient_person_id IS NOT NULL AND noshow.app_patient_person_id = cp.cp_patient_person_id)
               OR (noshow.app_patient_dependent_id IS NOT NULL AND noshow.app_patient_dependent_id = cp.cp_patient_dependent_id))
             AND noshow.app_state = 'no_asistio'
         ) AS "noShowCount"
       FROM care_packages cp
       LEFT JOIN appointments assessment ON assessment.app_id = cp.cp_assessment_app_id
       LEFT JOIN person patient ON patient.per_id = cp.cp_patient_person_id
       LEFT JOIN dependents dep ON dep.dep_id = cp.cp_patient_dependent_id
       LEFT JOIN person psy ON psy.per_id = cp.psy_id
       LEFT JOIN appointments a ON a.cp_id = cp.cp_id
       WHERE cp.cp_id = $1
       GROUP BY cp.cp_id, psy.per_name, dep.dep_name, patient.per_name`,
    [id],
  );

  const row = rows[0];
  if (!row) throw new NotFoundException('Paquete no encontrado');

  if (actor?.requesterId) {
    const allowed = await this.db.query<any[]>(
      `SELECT 1 FROM care_packages cp
         LEFT JOIN requester_dependent rd ON rd.dep_id = cp.cp_patient_dependent_id
         WHERE cp.cp_id = $1 AND (cp.cp_patient_person_id = $2 OR rd.req_id = $2)`,
      [id, actor.requesterId],
    );
    if (!allowed.length) throw new NotFoundException('Paquete no encontrado');
  }

  return row;
}

  /**
   * Finds up to 30 days of availability for the package psychologist.
   * @param id Care package identifier.
   * @param actor Requester or secretary allowed to view the package.
   * @param query Availability range and appointment duration.
   * @returns A promise resolving to package-scoped availability slots.
   */
  async availability(
  id: number,
  actor: { requesterId?: number; secretaryId?: number },
  query: CarePackageAvailabilityQueryDto,
) {
  const p = await this.find(id, actor);
  return this.schedule.findAvailability({
    ...query,
    psychologistIds: String(p.psychologistId),
  });
}

  /**
   * Schedules an appointment inside an active care package.
   */
  async scheduleAppointment(
  id: number,
  dto: SchedulePackageAppointmentDto,
  actor: { requesterId?: number; secretaryId?: number },
) {
  const date = new Date(dto.appDate);
  if (Number.isNaN(date.getTime()) || date <= new Date()) {
    throw new BadRequestException('La fecha debe ser futura');
  }

  return this.db.transaction(async (m) => {
    const p = (
      await m.query<any[]>(
        `SELECT cp.*, a.req_id, a.app_type
           FROM care_packages cp
           JOIN appointments a ON a.app_id = cp.cp_assessment_app_id
           WHERE cp.cp_id = $1
           FOR UPDATE`,
        [id],
      )
    )[0];

    if (!p) throw new NotFoundException('Paquete no encontrado');
    if (p.cp_state !== 'activo') {
      throw new BadRequestException('El paquete no está activo');
    }

    if (actor.requesterId && p.req_id !== actor.requesterId) {
      const ownsDependent = p.cp_patient_dependent_id
        ? await m.query<any[]>(
          `SELECT 1 FROM requester_dependent WHERE req_id = $1 AND dep_id = $2`,
          [actor.requesterId, p.cp_patient_dependent_id],
        )
        : [];
      if (!ownsDependent.length) {
        throw new NotFoundException('Paquete no encontrado');
      }
    }

    const used = await m.query<any[]>(
      `SELECT COUNT(*)::int AS count
         FROM appointments
         WHERE cp_id = $1 AND app_state IN ('realizada', 'asignada', 'confirmada')`,
      [id],
    );

    if (Number(used[0].count) >= Number(p.cp_session_limit)) {
      throw new ConflictException({
        error: 'NO_SLOTS_REMAINING',
        message: 'El paquete no tiene cupos disponibles',
      });
    }

    const day = date.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    const time = date.toLocaleTimeString('en-GB', {
      timeZone: 'America/Bogota',
      hour12: false,
    });

    await m.query(
      `SELECT pg_advisory_xact_lock(hashtext('care-package-slot'), hashtext($1::text || $2::text || $3::text))`,
      [p.psy_id, day, time],
    );

    const free = await m.query<any[]>(
      `SELECT 1 WHERE (
           EXISTS (
             SELECT 1 FROM schedule s
             WHERE s.psy_id = $1 AND s.sch_date = $2::date
               AND s.sch_start_time <= $3::time
               AND s.sch_end_time >= ($3::time + interval '60 minutes')
           )
           OR EXISTS (
             SELECT 1 FROM schedule_recurring_blocks r
             WHERE r.psy_id = $1 AND r.srb_active = true
               AND r.srb_day_of_week = EXTRACT(ISODOW FROM $2::date)
               AND r.srb_valid_from <= $2::date
               AND (r.srb_valid_until IS NULL OR r.srb_valid_until >= $2::date)
               AND r.srb_start_time <= $3::time
               AND r.srb_end_time >= ($3::time + interval '60 minutes')
           )
         )
         AND NOT EXISTS (
           SELECT 1 FROM schedule_occupancy
           WHERE psy_id = $1 AND occ_date = $2::date
             AND occ_start_time < ($3::time + interval '60 minutes')
             AND occ_end_time > $3::time
         )`,
      [p.psy_id, day, time],
    );

    if (!free.length) {
      throw new ConflictException({
        error: 'SCHEDULE_SLOT_TAKEN',
        message: 'La franja ya no está disponible',
      });
    }

    const app = (
      await m.query<any[]>(
        `INSERT INTO appointments(
             req_id,
             app_patient_person_id,
             app_patient_dependent_id,
             psy_id,
             sec_id,
             app_date,
             app_duration,
             app_state,
             app_type,
             app_created_at,
             cp_id,
             app_kind
           ) VALUES ($1, $2, $3, $4, $5, $6, 60, 'confirmada', $7, now(), $8, 'paquete')
           RETURNING
             app_id AS "appId",
             app_date AS "appDate",
             app_kind AS "appKind",
             cp_id AS "carePackageId"`,
        [
          p.req_id,
          p.cp_patient_person_id,
          p.cp_patient_dependent_id,
          p.psy_id,
          actor.secretaryId ?? null,
          date,
          p.app_type,
          id,
        ],
      )
    )[0];

    await m.query(
      `INSERT INTO schedule_occupancy(
           psy_id,
           app_id,
           occ_date,
           occ_start_time,
           occ_end_time,
           source_type
         ) VALUES ($1, $2, $3::date, $4::time, ($4::time + interval '60 minutes'), 'appointment')`,
      [p.psy_id, app.appId, day, time],
    );

    return app;
  });
}

  /**
   * Closes a package (finalizado or cancelado).
   */
  async close(
  id: number,
  state: 'finalizado' | 'cancelado',
  dto: CloseCarePackageDto,
  secretaryId: number,
) {
  return this.db.transaction(async (m) => {
    const p = (
      await m.query<any[]>(
        `SELECT * FROM care_packages WHERE cp_id = $1 FOR UPDATE`,
        [id],
      )
    )[0];
    if (!p) throw new NotFoundException('Paquete no encontrado');
    if (p.cp_state !== 'activo') {
      throw new BadRequestException('El paquete ya está cerrado');
    }

    await m.query(
      `UPDATE appointments
         SET app_state = 'cancelada'
         WHERE cp_id = $1 AND app_state IN ('asignada', 'confirmada')`,
      [id],
    );
    await m.query(
      `DELETE FROM schedule_occupancy
         WHERE app_id IN (
           SELECT app_id FROM appointments WHERE cp_id = $1 AND app_state = 'cancelada'
         )`,
      [id],
    );
    await m.query(
      `UPDATE care_packages
         SET cp_state = $1,
             cp_closed_at = now(),
             cp_closed_by = $2,
             cp_close_reason = $3
         WHERE cp_id = $4`,
      [state, secretaryId, dto.reason ?? null, id],
    );

    return this.find(id);
  });
}

  /**
   * Lists availability strictly for the treating psychologist of a finalized care package
   * so the consultant can schedule a new valuation appointment.
   * Rejects if the package is not finalized, if the patient already has an active or suggested
   * package, or if there is already a valuation appointment in progress.
   */
  async followUpValuationAvailability(
    packageId: number,
    requesterId: number,
    query: CarePackageAvailabilityQueryDto,
  ) {
    const p = await this.find(packageId, { requesterId });

    if (p.state !== 'finalizado') {
      if (p.state === 'activo') {
        throw new ConflictException({
          error: 'ACTIVE_CARE_PACKAGE_EXISTS',
          message: 'El paciente cuenta con un paquete activo. Debe agendar sus citas dentro del paquete actual.',
        });
      }
      throw new BadRequestException({
        error: 'CARE_PACKAGE_NOT_FINALIZED',
        message: 'Solo puede solicitar una nueva valoración cuando el paquete anterior haya finalizado',
      });
    }

    await this.assertEligibleForFollowUpValuation(
      this.db,
      packageId,
      p.patientPersonId ?? null,
      p.patientDependentId ?? null,
    );

    return this.schedule.findAvailability({
      ...query,
      psychologistIds: String(p.psychologistId),
    });
  }

  /**
   * Schedules a new follow-up valuation appointment strictly with the treating psychologist
   * of a finalized care package. The appointment is created immediately in 'confirmada' state
   * with app_kind = 'valoracion' so the treating psychologist can conduct the valuation and
   * suggest a new care package (which will then go through secretary review).
   */
  async scheduleFollowUpValuation(
    packageId: number,
    dto: ScheduleFollowUpValuationDto,
    requesterId: number,
  ) {
    const date = new Date(dto.appDate);
    if (Number.isNaN(date.getTime()) || date <= new Date()) {
      throw new BadRequestException({
        error: 'INVALID_APPOINTMENT_DATE',
        message: 'La fecha de la nueva valoración debe ser posterior al momento actual',
      });
    }

    return this.db.transaction(async (m) => {
      const p = (
        await m.query<any[]>(
          `SELECT cp.*, a.req_id, a.app_type
           FROM care_packages cp
           JOIN appointments a ON a.app_id = cp.cp_assessment_app_id
           WHERE cp.cp_id = $1
           FOR UPDATE`,
          [packageId],
        )
      )[0];

      if (!p) throw new NotFoundException('Paquete no encontrado');

      if (p.req_id !== requesterId) {
        const ownsDependent = p.cp_patient_dependent_id
          ? await m.query<any[]>(
              `SELECT 1 FROM requester_dependent WHERE req_id = $1 AND dep_id = $2`,
              [requesterId, p.cp_patient_dependent_id],
            )
          : [];
        if (!ownsDependent.length) {
          throw new NotFoundException('Paquete no encontrado');
        }
      }

      if (p.cp_state !== 'finalizado') {
        if (p.cp_state === 'activo') {
          throw new ConflictException({
            error: 'ACTIVE_CARE_PACKAGE_EXISTS',
            message: 'El paciente cuenta con un paquete activo. Debe agendar sus citas dentro del paquete actual.',
          });
        }
        throw new BadRequestException({
          error: 'CARE_PACKAGE_NOT_FINALIZED',
          message: 'Solo puede solicitar una nueva valoración cuando el paquete anterior haya finalizado',
        });
      }

      await this.assertEligibleForFollowUpValuation(
        m,
        packageId,
        p.cp_patient_person_id ?? null,
        p.cp_patient_dependent_id ?? null,
      );

      const activePsy = await m.query<any[]>(
        `SELECT p.psy_id
         FROM psychologist p
         JOIN person per ON per.per_id = p.psy_id
         WHERE p.psy_id = $1 AND per.per_state = 'activo'`,
        [p.psy_id],
      );
      if (!activePsy.length) {
        throw new BadRequestException({
          error: 'PSYCHOLOGIST_NOT_AVAILABLE',
          message: 'El psicólogo tratante no se encuentra activo actualmente',
        });
      }

      const day = date.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
      const time = date.toLocaleTimeString('en-GB', {
        timeZone: 'America/Bogota',
        hour12: false,
      });

      await m.query(
        `SELECT pg_advisory_xact_lock(hashtext('care-package-slot'), hashtext($1::text || $2::text || $3::text))`,
        [p.psy_id, day, time],
      );

      const free = await m.query<any[]>(
        `SELECT 1 WHERE (
           EXISTS (
             SELECT 1 FROM schedule s
             WHERE s.psy_id = $1 AND s.sch_date = $2::date
               AND s.sch_start_time <= $3::time
               AND s.sch_end_time >= ($3::time + interval '60 minutes')
           )
           OR EXISTS (
             SELECT 1 FROM schedule_recurring_blocks r
             WHERE r.psy_id = $1 AND r.srb_active = true
               AND r.srb_day_of_week = EXTRACT(ISODOW FROM $2::date)
               AND r.srb_valid_from <= $2::date
               AND (r.srb_valid_until IS NULL OR r.srb_valid_until >= $2::date)
               AND r.srb_start_time <= $3::time
               AND r.srb_end_time >= ($3::time + interval '60 minutes')
           )
         )
         AND NOT EXISTS (
           SELECT 1 FROM schedule_occupancy
           WHERE psy_id = $1 AND occ_date = $2::date
             AND occ_start_time < ($3::time + interval '60 minutes')
             AND occ_end_time > $3::time
         )`,
        [p.psy_id, day, time],
      );

      if (!free.length) {
        throw new ConflictException({
          error: 'SCHEDULE_SLOT_TAKEN',
          message: 'La franja horaria seleccionada ya no está disponible para su psicólogo tratante',
        });
      }

      const modality = dto.appType ?? p.app_type;
      const reason = dto.appReason?.trim() || null;

      const app = (
        await m.query<any[]>(
          `INSERT INTO appointments(
             req_id,
             app_patient_person_id,
             app_patient_dependent_id,
             psy_id,
             sec_id,
             app_date,
             app_duration,
             app_state,
             app_type,
             app_reason,
             app_created_at,
             cp_id,
             app_kind
           ) VALUES ($1, $2, $3, $4, NULL, $5, 60, 'confirmada', $6, $7, now(), NULL, 'valoracion')
           RETURNING
             app_id AS "appId",
             app_date AS "appDate",
             app_state AS "appState",
             app_kind AS "appKind",
             app_type AS "appType",
             psy_id AS "psychologistId",
             cp_id AS "carePackageId"`,
          [
            requesterId,
            p.cp_patient_person_id,
            p.cp_patient_dependent_id,
            p.psy_id,
            date,
            modality,
            reason,
          ],
        )
      )[0];

      await m.query(
        `INSERT INTO schedule_occupancy(
           psy_id,
           app_id,
           occ_date,
           occ_start_time,
           occ_end_time,
           source_type
         ) VALUES ($1, $2, $3::date, $4::time, ($4::time + interval '60 minutes'), 'appointment')`,
        [p.psy_id, app.appId, day, time],
      );

      return app;
    });
  }

  private async assertEligibleForFollowUpValuation(
    executor: { query: <T = any>(sql: string, params?: any[]) => Promise<T> },
    packageId: number,
    patientPersonId: number | null,
    patientDependentId: number | null,
  ): Promise<void> {
    const activeOrSuggestedPackages = await executor.query<any[]>(
      `SELECT cp_id, cp_state
       FROM care_packages
       WHERE cp_state IN ('activo', 'sugerido')
         AND ((cp_patient_person_id IS NOT NULL AND cp_patient_person_id = $1)
           OR (cp_patient_dependent_id IS NOT NULL AND cp_patient_dependent_id = $2))
       LIMIT 1`,
      [patientPersonId, patientDependentId],
    );

    if (activeOrSuggestedPackages.length) {
      const state = activeOrSuggestedPackages[0].cp_state;
      if (state === 'activo') {
        throw new ConflictException({
          error: 'ACTIVE_CARE_PACKAGE_EXISTS',
          message: 'El paciente cuenta con un paquete activo. Debe agendar sus citas dentro del paquete actual.',
        });
      }
      throw new ConflictException({
        error: 'SUGGESTED_CARE_PACKAGE_PENDING',
        message: 'El paciente ya tiene una sugerencia de paquete pendiente de aprobación por secretaría.',
      });
    }

    const newerFinalizedPackage = await executor.query<any[]>(
      `SELECT cp_id
       FROM care_packages
       WHERE cp_state = 'finalizado'
         AND cp_id > $1
         AND ((cp_patient_person_id IS NOT NULL AND cp_patient_person_id = $2)
           OR (cp_patient_dependent_id IS NOT NULL AND cp_patient_dependent_id = $3))
       LIMIT 1`,
      [packageId, patientPersonId, patientDependentId],
    );
    if (newerFinalizedPackage.length) {
      throw new ConflictException({
        error: 'NEWER_CARE_PACKAGE_EXISTS',
        message: 'Debe solicitar la nueva valoración a partir del paquete finalizado más reciente del paciente.',
      });
    }

    const openValuation = await executor.query<any[]>(
      `SELECT a.app_id, a.app_state
       FROM appointments a
       WHERE a.app_kind = 'valoracion'
         AND ((a.app_patient_person_id IS NOT NULL AND a.app_patient_person_id = $1)
           OR (a.app_patient_dependent_id IS NOT NULL AND a.app_patient_dependent_id = $2))
         AND (
           a.app_state IN ('pendiente', 'remitida', 'asignada', 'confirmada')
           OR (
             a.app_state = 'realizada'
             AND a.app_referred_to_psy_id IS NULL
             AND NOT EXISTS (
               SELECT 1 FROM care_packages cp WHERE cp.cp_assessment_app_id = a.app_id
             )
           )
         )
       LIMIT 1`,
      [patientPersonId, patientDependentId],
    );

    if (openValuation.length) {
      throw new ConflictException({
        error: 'VALUATION_ALREADY_IN_PROGRESS',
        message: 'El paciente ya tiene una cita de valoración en curso o pendiente de sugerencia de paquete.',
      });
    }
  }
}

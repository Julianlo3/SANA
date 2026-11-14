import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ScheduleService } from '../schedule/schedule.service.js';
import type {
  ApproveCarePackageDto,
  CloseCarePackageDto,
  CreateCarePackageDto,
  RejectCarePackageDto,
  SchedulePackageAppointmentDto,
  SuggestCarePackageDto,
} from './dto/care-package.dto.js';

@Injectable()
export class CarePackagesService {
  constructor(
    private readonly db: DataSource,
    private readonly schedule: ScheduleService,
  ) {}

  /**
   * Psychologist suggests a care package after a valuation appointment.
   */
  async suggest(dto: SuggestCarePackageDto, psychologistId: number) {
    return this.db.transaction(async (m) => {
      const a = (
        await m.query<any[]>(
          `SELECT app_id, app_state, app_kind, psy_id, app_patient_person_id, app_patient_dependent_id
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
           AND ((cp_patient_person_id IS NOT NULL AND cp_patient_person_id = $1)
             OR (cp_patient_dependent_id IS NOT NULL AND cp_patient_dependent_id = $2))
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
         ) VALUES ($1, $2, $3, $4, NULL, $5, $6, 'sugerido', $7, $5, $6)
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
           AND ((cp_patient_person_id IS NOT NULL AND cp_patient_person_id = $2)
             OR (cp_patient_dependent_id IS NOT NULL AND cp_patient_dependent_id = $3))
         FOR UPDATE`,
        [id, p.cp_patient_person_id, p.cp_patient_dependent_id],
      );
      if (active.length) {
        throw new ConflictException({
          error: 'ACTIVE_CARE_PACKAGE_EXISTS',
          message: 'El paciente ya cuenta con un paquete activo',
        });
      }

      const newSessionLimit = dto.sessionLimit ?? p.cp_session_limit;
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
    return this.db.transaction(async (m) => {
      const a = (
        await m.query<any[]>(
          `SELECT app_id, app_state, app_kind, psy_id, app_patient_person_id, app_patient_dependent_id
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
  async findAll(state?: string) {
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
       GROUP BY cp.cp_id, psy.per_name, dep.dep_name, patient.per_name
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
    actor?: { requesterId?: number; psychologistId?: number; secretaryId?: number },
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
   * Finds availability strictly for the psychologist assigned to the package.
   */
  async availability(
    id: number,
    actor: { requesterId?: number; secretaryId?: number },
    query: any,
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
}

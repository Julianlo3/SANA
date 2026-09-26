import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { ScheduleBlockResponse } from './dto/schedule-block-response.dto.js';
import type { RecurringScheduleBlockResponse } from './dto/recurring-schedule-block-response.dto.js';
import type { ScheduleAvailabilitySlot } from './dto/schedule-availability-response.dto.js';

/**
 * Repository for handling schedule-related database operations, including schedule blocks and recurring schedule blocks for psychologists.
 */
@Injectable()
export class ScheduleRepository {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Finds all schedule blocks for the specified psychologist.
   * @param psychologistId The ID of the psychologist.
   * @returns A promise that resolves to the list of schedule blocks.
   */
  async findBlocks(psychologistId: number): Promise<ScheduleBlockResponse[]> {
    return this.dataSource.query<ScheduleBlockResponse[]>(
      `SELECT
         sch_id AS "id",
         sch_date AS "date",
         sch_start_time AS "startTime",
         sch_end_time AS "endTime",
         sch_reason AS "reason",
         app_id AS "appointmentId"
       FROM schedule
       WHERE psy_id = $1
       ORDER BY sch_date, sch_start_time`,
      [psychologistId],
    );
  }

  /**
   * Checks if there is an overlap in schedule blocks for the specified psychologist.
   * @param psychologistId The ID of the psychologist.
   * @param date The date of the schedule block.
   * @param startTime The start time of the schedule block.
   * @param endTime The end time of the schedule block.
   * @returns A promise that resolves to a boolean indicating if there is an overlap.
   */
  async hasOverlap(
    psychologistId: number,
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<boolean> {
    const rows = await this.dataSource.query<{ exists: boolean }[]>(
      `SELECT EXISTS (
         SELECT 1
         FROM schedule
         WHERE psy_id = $1
           AND sch_date = $2::date
           AND sch_start_time < $4::time
           AND sch_end_time > $3::time
       ) AS exists`,
      [psychologistId, date, startTime, endTime],
    );
    return rows[0]?.exists ?? false;
  }

  /**
   * Creates a new schedule block for the specified psychologist.
   * @param params The parameters for creating the schedule block.
   * @returns A promise that resolves to the created schedule block.
   */
  async createBlock(params: {
    psychologistId: number;
    date: string;
    startTime: string;
    endTime: string;
    reason: string;
  }): Promise<ScheduleBlockResponse> {
    const rows = await this.dataSource.query<ScheduleBlockResponse[]>(
      `INSERT INTO schedule (
         psy_id, sch_date, sch_start_time, sch_end_time, sch_reason
       )
       VALUES ($1, $2::date, $3::time, $4::time, $5)
       RETURNING
         sch_id AS "id",
         sch_date AS "date",
         sch_start_time AS "startTime",
         sch_end_time AS "endTime",
         sch_reason AS "reason",
         app_id AS "appointmentId"`,
      [
        params.psychologistId,
        params.date,
        params.startTime,
        params.endTime,
        params.reason,
      ],
    );
    return rows[0];
  }

  /**
   * Deletes a schedule block for the specified psychologist.
   * @param psychologistId The ID of the psychologist.
   * @param blockId The ID of the schedule block to delete.
   * @returns A promise that resolves to a boolean indicating if the block was deleted.
   */
  async deleteBlock(psychologistId: number, blockId: number): Promise<boolean> {
    const result = await this.dataSource.query(
      `DELETE FROM schedule
       WHERE sch_id = $1 AND psy_id = $2 AND app_id IS NULL`,
      [blockId, psychologistId],
    );
    return result.rowCount > 0;
  }

  /**
   * Finds all recurring schedule blocks for the specified psychologist.
   * @param psychologistId The ID of the psychologist.
   * @returns A promise that resolves to the list of recurring schedule blocks.
   */
  async findRecurringBlocks(
    psychologistId: number,
  ): Promise<RecurringScheduleBlockResponse[]> {
    return this.dataSource.query<RecurringScheduleBlockResponse[]>(
      `SELECT
         srb_id AS "id",
         srb_day_of_week AS "dayOfWeek",
         srb_start_time AS "startTime",
         srb_end_time AS "endTime",
         srb_valid_from AS "validFrom",
         srb_valid_until AS "validUntil",
         srb_reason AS "reason",
         srb_active AS "active"
       FROM schedule_recurring_blocks
       WHERE psy_id = $1
       ORDER BY srb_day_of_week, srb_start_time`,
      [psychologistId],
    );
  }

  /**
   * Checks if there is an overlap with existing recurring schedule blocks.
   * @param params The parameters for checking the overlap.
   * @returns A promise that resolves to a boolean indicating if there is an overlap.
   */
  async hasRecurringOverlap(params: {
    psychologistId: number;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    validFrom: string;
    validUntil?: string;
  }): Promise<boolean> {
    const rows = await this.dataSource.query<{ exists: boolean }[]>(
      `SELECT EXISTS (
         SELECT 1
         FROM schedule_recurring_blocks
         WHERE psy_id = $1
           AND srb_active = true
           AND srb_day_of_week = $2
           AND srb_start_time < $4::time
           AND srb_end_time > $3::time
           AND srb_valid_from <= COALESCE($6::date, '9999-12-31'::date)
           AND COALESCE(srb_valid_until, '9999-12-31'::date) >= $5::date
       ) AS exists`,
      [
        params.psychologistId,
        params.dayOfWeek,
        params.startTime,
        params.endTime,
        params.validFrom,
        params.validUntil ?? null,
      ],
    );
    return rows[0]?.exists ?? false;
  }

  /**
   * Creates a new recurring schedule block.
   * @param params The parameters for creating the recurring schedule block.
   * @returns A promise that resolves to the created recurring schedule block.
   */
  async createRecurringBlock(params: {
    psychologistId: number;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    validFrom: string;
    validUntil?: string;
    reason: string;
  }): Promise<RecurringScheduleBlockResponse> {
    const rows = await this.dataSource.query<RecurringScheduleBlockResponse[]>(
      `INSERT INTO schedule_recurring_blocks (
         psy_id, srb_day_of_week, srb_start_time, srb_end_time,
         srb_valid_from, srb_valid_until, srb_reason
       )
       VALUES ($1, $2, $3::time, $4::time, $5::date, $6::date, $7)
       RETURNING
         srb_id AS "id",
         srb_day_of_week AS "dayOfWeek",
         srb_start_time AS "startTime",
         srb_end_time AS "endTime",
         srb_valid_from AS "validFrom",
         srb_valid_until AS "validUntil",
         srb_reason AS "reason",
         srb_active AS "active"`,
      [
        params.psychologistId,
        params.dayOfWeek,
        params.startTime,
        params.endTime,
        params.validFrom,
        params.validUntil ?? null,
        params.reason,
      ],
    );
    return rows[0];
  }

  /**
   * Deletes a recurring schedule block for the specified psychologist.
   * @param psychologistId The ID of the psychologist.
   * @param blockId The ID of the schedule block to delete.
   * @returns A promise that resolves to a boolean indicating if the block was deleted.
   */
  async deleteRecurringBlock(
    psychologistId: number,
    blockId: number,
  ): Promise<boolean> {
    const result = await this.dataSource.query(
      `DELETE FROM schedule_recurring_blocks
       WHERE srb_id = $1 AND psy_id = $2`,
      [blockId, psychologistId],
    );
    return result.rowCount > 0;
  }

  /**
   * Finds available schedule slots for the specified parameters.
   * @param params The parameters for finding availability.
   * @returns A promise that resolves to an array of available schedule slots.
   */
  async findAvailability(params: {
    appointmentStart: string;
    duration: number;
    delayHours: number;
    psychologistIds?: number[];
  }): Promise<Array<ScheduleAvailabilitySlot & { psychologistId: number; psychologistName: string; speciality: string }>> {
    const psychologistFilter = params.psychologistIds?.length
      ? 'AND p.psy_id = ANY($4::int[])'
      : '';
    return this.dataSource.query(
      `WITH availability_window AS (
         SELECT $1::timestamptz AS start_at,
                ($1::timestamptz + ($2 || ' hours')::interval) AS end_at
       ), slots AS (
         SELECT generate_series(
           start_at,
           end_at - ($3 || ' minutes')::interval,
           ($3 || ' minutes')::interval
         ) AS start_at
         FROM availability_window
       )
       SELECT s.start_at::date AS "date", s.start_at::time AS "startTime",
         (s.start_at + ($3 || ' minutes')::interval)::time AS "endTime",
         p.psy_id AS "psychologistId", per.per_name AS "psychologistName",
         p.psy_speciality AS speciality
       FROM slots s
       CROSS JOIN psychologist p
       JOIN person per ON per.per_id = p.psy_id
       WHERE per.per_state = 'activo'
         ${psychologistFilter}
         AND NOT EXISTS (
           SELECT 1 FROM schedule b
           WHERE b.psy_id = p.psy_id AND b.sch_date = s.start_at::date
             AND b.sch_start_time < (s.start_at + ($3 || ' minutes')::interval)::time
             AND b.sch_end_time > s.start_at::time
         )
         AND NOT EXISTS (
           SELECT 1 FROM appointments a
           WHERE a.psy_id = p.psy_id
             AND a.app_state IN ('asignada', 'confirmada')
             AND a.app_date IS NOT NULL
             AND a.app_date::date = s.start_at::date
             AND a.app_date::time < (s.start_at + ($3 || ' minutes')::interval)::time
             AND (a.app_date + (a.app_duration || ' minutes')::interval)::time > s.start_at::time
         )
         AND NOT EXISTS (
           SELECT 1 FROM schedule_recurring_blocks r
           WHERE r.psy_id = p.psy_id AND r.srb_active = true
             AND r.srb_day_of_week = EXTRACT(ISODOW FROM s.start_at::date)
             AND r.srb_valid_from <= s.start_at::date
             AND (r.srb_valid_until IS NULL OR r.srb_valid_until >= s.start_at::date)
             AND r.srb_start_time < (s.start_at + ($3 || ' minutes')::interval)::time
             AND r.srb_end_time > s.start_at::time
         )
       ORDER BY s.start_at, per.per_name`,
      [params.appointmentStart, params.delayHours, params.duration, params.psychologistIds ?? null],
    );
  }

  /**
   * Checks if a schedule slot is available for the specified psychologist.
   * @param params The parameters for checking availability.
   * @returns A promise that resolves to a boolean indicating if the slot is available.
   */
  async assignAppointmentSlot(params: {
    appId: number;
    secretaryUserId: number;
    psyId: number;
    appDate: Date;
    appDuration: number;
  }): Promise<'assigned' | 'slot_taken' | 'not_assignable'> {
    return this.dataSource.transaction(async (manager) => {
      const appointments = await manager.query<
        { app_state: string; psy_id: number | null }[]
      >(
        `SELECT app_state, psy_id
         FROM appointments
         WHERE app_id = $1
         FOR UPDATE`,
        [params.appId],
      );
      const appointment = appointments[0];
      if (!appointment || !['pendiente', 'asignada'].includes(appointment.app_state)) {
        return 'not_assignable';
      }

      await manager.query(
        `SELECT pg_advisory_xact_lock($1, hashtext($2::text))`,
        [params.psyId, params.appDate.toISOString().slice(0, 10)],
      );

      const concreteConflict = await manager.query<{ exists: boolean }[]>(
        `SELECT EXISTS (
           SELECT 1 FROM schedule
           WHERE psy_id = $1
             AND sch_date = $2::date
             AND sch_start_time < ($2::time + ($3 || ' minutes')::interval)::time
             AND sch_end_time > $2::time
         ) AS exists`,
        [params.psyId, params.appDate, params.appDuration],
      );
      if (concreteConflict[0]?.exists) return 'slot_taken';

      const recurringConflict = await manager.query<{ exists: boolean }[]>(
        `SELECT EXISTS (
           SELECT 1 FROM schedule_recurring_blocks
           WHERE psy_id = $1
             AND srb_active = true
             AND srb_day_of_week = EXTRACT(ISODOW FROM $2::date)
             AND srb_valid_from <= $2::date
             AND (srb_valid_until IS NULL OR srb_valid_until >= $2::date)
             AND srb_start_time < ($2::time + ($3 || ' minutes')::interval)::time
             AND srb_end_time > $2::time
         ) AS exists`,
        [params.psyId, params.appDate, params.appDuration],
      );
      if (recurringConflict[0]?.exists) return 'slot_taken';

      const assignedConflict = await manager.query<{ exists: boolean }[]>(
        `SELECT EXISTS (
           SELECT 1 FROM appointments
           WHERE app_id <> $1
             AND psy_id = $2
             AND app_state IN ('asignada', 'confirmada')
             AND app_date IS NOT NULL
             AND app_date::date = $3::date
             AND app_date::time < ($3::time + ($4 || ' minutes')::interval)::time
             AND (app_date + (app_duration || ' minutes')::interval)::time > $3::time
         ) AS exists`,
        [params.appId, params.psyId, params.appDate, params.appDuration],
      );
      if (assignedConflict[0]?.exists) return 'slot_taken';

      await manager.query(
        `UPDATE appointments
         SET app_state = 'asignada', psy_id = $1, sec_id = $2,
             app_date = $3, app_duration = $4
         WHERE app_id = $5`,
        [params.psyId, params.secretaryUserId, params.appDate, params.appDuration, params.appId],
      );
      return 'assigned';
    });
  }

  /**
   * Confirms an appointment with a schedule slot.
   * @param params The parameters for confirming the appointment.
   * @returns A promise that resolves to the confirmation result.
   */
  async confirmWithSchedule(params: {
    appId: number;
    secretaryUserId: number;
    psyId: number;
    appDate: Date;
    appDuration: number;
  }): Promise<'confirmed' | 'slot_taken'> {
    return this.dataSource.transaction(async (manager) => {
      const rows = await manager.query<{ psy_id: number | null; app_state: string }[]>(
        `SELECT psy_id, app_state FROM appointments WHERE app_id = $1 FOR UPDATE`,
        [params.appId],
      );
      const appointment = rows[0];
      if (!appointment || appointment.app_state !== 'asignada') return 'slot_taken';
      if (appointment.psy_id !== params.psyId) return 'slot_taken';

      await manager.query(
        `SELECT pg_advisory_xact_lock($1, hashtext($2::text))`,
        [params.psyId, params.appDate.toISOString().slice(0, 10)],
      );

      const assignedSlot = await manager.query<{
        app_date: Date | null;
        app_duration: number | null;
      }[]>(
        `SELECT app_date, app_duration FROM appointments WHERE app_id = $1`,
        [params.appId],
      );
      const slot = assignedSlot[0];
      if (
        !slot?.app_date ||
        new Date(slot.app_date).getTime() !== params.appDate.getTime() ||
        slot.app_duration !== params.appDuration
      ) {
        return 'slot_taken';
      }

      const conflict = await manager.query<{ exists: boolean }[]>(
        `SELECT EXISTS (
           SELECT 1 FROM schedule
           WHERE psy_id = $1 AND sch_date = $2::date
             AND sch_start_time < ($3::time + ($4 || ' minutes')::interval)::time
             AND sch_end_time > $3::time
         ) AS exists`,
        [params.psyId, params.appDate, params.appDate, params.appDuration],
      );
      if (conflict[0]?.exists) return 'slot_taken';

      const recurringConflict = await manager.query<{ exists: boolean }[]>(
        `SELECT EXISTS (
           SELECT 1 FROM schedule_recurring_blocks
           WHERE psy_id = $1 AND srb_active = true
             AND srb_day_of_week = EXTRACT(ISODOW FROM $2::date)
             AND srb_valid_from <= $2::date
             AND (srb_valid_until IS NULL OR srb_valid_until >= $2::date)
             AND srb_start_time < ($3::time + ($4 || ' minutes')::interval)::time
             AND srb_end_time > $3::time
         ) AS exists`,
        [params.psyId, params.appDate, params.appDate, params.appDuration],
      );
      if (recurringConflict[0]?.exists) return 'slot_taken';

      const assignedConflict = await manager.query<{ exists: boolean }[]>(
        `SELECT EXISTS (
           SELECT 1 FROM appointments
           WHERE app_id <> $1
             AND psy_id = $2
             AND app_state IN ('asignada', 'confirmada')
             AND app_date IS NOT NULL
             AND app_date::date = $3::date
             AND app_date::time < ($3::time + ($4 || ' minutes')::interval)::time
             AND (app_date + (app_duration || ' minutes')::interval)::time > $3::time
         ) AS exists`,
        [params.appId, params.psyId, params.appDate, params.appDuration],
      );
      if (assignedConflict[0]?.exists) return 'slot_taken';

      await manager.query(
        `UPDATE appointments
         SET app_state = 'confirmada', sec_id = $1, psy_id = $2,
             app_date = $3, app_duration = $4
         WHERE app_id = $5`,
        [params.secretaryUserId, params.psyId, params.appDate, params.appDuration, params.appId],
      );
      await manager.query(
        `INSERT INTO schedule (psy_id, app_id, sch_date, sch_start_time, sch_end_time, sch_reason)
         VALUES ($1, $2, $3::date, $4::time,
                 ($4::time + ($5 || ' minutes')::interval)::time, $6)`,
        [params.psyId, params.appId, params.appDate, params.appDate, params.appDuration, 'appointment'],
      );
      return 'confirmed';
    });
  }
}

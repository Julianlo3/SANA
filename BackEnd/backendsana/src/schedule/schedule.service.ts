import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../interfaces/auth.interface.js';
import { ScheduleRepository } from './schedule.repository.js';
import type { CreateScheduleBlockDto } from './dto/create-schedule-block.dto.js';
import type { ScheduleBlockResponse } from './dto/schedule-block-response.dto.js';
import type { CreateRecurringScheduleBlockDto } from './dto/create-recurring-schedule-block.dto.js';
import type { RecurringScheduleBlockResponse } from './dto/recurring-schedule-block-response.dto.js';
import type { ScheduleAvailabilityQueryDto } from './dto/schedule-availability-query.dto.js';
import type { ScheduleAvailabilitySlot } from './dto/schedule-availability-response.dto.js';

/**
 * Service for managing schedule blocks and recurring schedule blocks for psychologists.
 */
@Injectable()
export class ScheduleService {
  constructor(private readonly repository: ScheduleRepository) {}

  /**
   * Finds all schedule blocks for the specified psychologist.
   * @param user The authenticated user.
   * @returns A promise that resolves to the list of schedule blocks.
   */
  async findMyBlocks(user: AuthenticatedUser): Promise<ScheduleBlockResponse[]> {
    this.ensurePsychologist(user);
    return this.repository.findBlocks(user.personId);
  }

  /**
   * Creates a new schedule block for the specified psychologist.
   * @param user The authenticated user.
   * @param dto The data for creating the schedule block.
   * @returns A promise that resolves to the created schedule block.
   */
  async createMyBlock(
    user: AuthenticatedUser,
    dto: CreateScheduleBlockDto,
  ): Promise<ScheduleBlockResponse> {
    this.ensurePsychologist(user);
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException({
        error: 'INVALID_TIME_RANGE',
        message: 'La hora de inicio debe ser anterior a la hora de finalización',
      });
    }

    if (await this.repository.hasOverlap(user.personId, dto.date, dto.startTime, dto.endTime)) {
      throw new ConflictException({
        error: 'SCHEDULE_BLOCK_OVERLAP',
        message: 'La franja se cruza con otro bloqueo o una cita existente',
      });
    }

    return this.repository.createBlock({
      psychologistId: user.personId,
      date: dto.date,
      startTime: dto.startTime,
      endTime: dto.endTime,
      reason: dto.reason.trim(),
    });
  }

  /**
   * Deletes a schedule block for the specified psychologist.
   * @param user The authenticated user.
   * @param blockId The ID of the schedule block to delete.
   */
  async deleteMyBlock(user: AuthenticatedUser, blockId: number): Promise<void> {
    this.ensurePsychologist(user);
    const deleted = await this.repository.deleteBlock(user.personId, blockId);
    if (!deleted) {
      throw new NotFoundException('El bloqueo no existe, no pertenece al psicólogo o ya está ocupado por una cita');
    }
  }

  /**
   * Finds all recurring schedule blocks for the specified psychologist.
   * @param user The authenticated user.
   * @returns A promise that resolves to the list of recurring schedule blocks.
   */
  async findMyRecurringBlocks(
    user: AuthenticatedUser,
  ): Promise<RecurringScheduleBlockResponse[]> {
    this.ensurePsychologist(user);
    return this.repository.findRecurringBlocks(user.personId);
  }

  /**
   * Creates a new recurring schedule block for the specified psychologist.
   * @param user The authenticated user.
   * @param dto The data for creating the recurring schedule block.
   * @returns A promise that resolves to the created recurring schedule block.
   */
  async createMyRecurringBlock(
    user: AuthenticatedUser,
    dto: CreateRecurringScheduleBlockDto,
  ): Promise<RecurringScheduleBlockResponse> {
    this.ensurePsychologist(user);
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException({
        error: 'INVALID_TIME_RANGE',
        message: 'La hora de inicio debe ser anterior a la hora de finalización',
      });
    }
    if (dto.validUntil && dto.validUntil < dto.validFrom) {
      throw new BadRequestException({
        error: 'INVALID_VALIDITY_RANGE',
        message: 'La fecha final debe ser igual o posterior a la fecha inicial',
      });
    }
    if (
      await this.repository.hasRecurringOverlap({
        psychologistId: user.personId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        validFrom: dto.validFrom,
        validUntil: dto.validUntil,
      })
    ) {
      throw new ConflictException({
        error: 'RECURRING_SCHEDULE_BLOCK_OVERLAP',
        message: 'La regla se cruza con otra indisponibilidad recurrente',
      });
    }

    return this.repository.createRecurringBlock({
      psychologistId: user.personId,
      dayOfWeek: dto.dayOfWeek,
      startTime: dto.startTime,
      endTime: dto.endTime,
      validFrom: dto.validFrom,
      validUntil: dto.validUntil,
      reason: dto.reason.trim(),
    });
  }

  /**
   * Deletes a recurring schedule block for the specified psychologist.
   * @param user The authenticated user.
   * @param blockId The ID of the schedule block to delete.
   */
  async deleteMyRecurringBlock(
    user: AuthenticatedUser,
    blockId: number,
  ): Promise<void> {
    this.ensurePsychologist(user);
    if (!(await this.repository.deleteRecurringBlock(user.personId, blockId))) {
      throw new NotFoundException('La regla recurrente no existe o no pertenece al psicólogo');
    }
  }

  /**
   * Finds available time slots for scheduling appointments.
   * @param query The query parameters for finding availability.
   * @returns A promise resolving to the available time slots.
   */
  async findAvailability(
    query: ScheduleAvailabilityQueryDto,
  ): Promise<ScheduleAvailabilitySlot[]> {
    const psychologistIds = query.psychologistIds
      ?.split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isInteger(value) && value > 0);
    const rows = await this.repository.findAvailability({
      appointmentStart: query.appointmentStart,
      delayHours: query.delayHours,
      duration: query.duration,
      psychologistIds,
    });
    const slots = new Map<string, ScheduleAvailabilitySlot>();
    for (const row of rows) {
      const key = `${row.date}|${row.startTime}|${row.endTime}`;
      const slot = slots.get(key) ?? {
        date: row.date,
        startTime: row.startTime,
        endTime: row.endTime,
        psychologists: [],
      };
      slot.psychologists.push({
        id: row.psychologistId,
        name: row.psychologistName,
        speciality: row.speciality,
      });
      slots.set(key, slot);
    }
    return [...slots.values()];
  }

  /**
   * Confirms an appointment slot for the specified parameters.
   * @param params The parameters for confirming the appointment slot.
   * @returns A promise resolving to a boolean indicating whether the appointment was confirmed.
   */
  async confirmAppointmentSlot(params: {
    appId: number;
    secretaryUserId: number;
    psyId: number;
    appDate: Date;
    appDuration: number;
  }): Promise<boolean> {
    return (await this.repository.confirmWithSchedule(params)) === 'confirmed';
  }

  /**
   * Checks if a schedule slot is available for the specified psychologist.
   * @param params The parameters for checking availability.
   * @returns A promise that resolves to a boolean indicating if the slot is available.
   */
  async assignAppointmentSlot(params: {
    appId: number;
    secretaryUserId: number;
    psychologistId: number;
    appDate: Date;
    duration: number;
  }): Promise<'assigned' | 'slot_taken' | 'not_assignable'> {
    return this.repository.assignAppointmentSlot({
      appId: params.appId,
      secretaryUserId: params.secretaryUserId,
      psyId: params.psychologistId,
      appDate: params.appDate,
      appDuration: params.duration,
    });
  }

  /**
   * Ensures that the authenticated user is a psychologist.
   * @param user The authenticated user.
   */
  private ensurePsychologist(user: AuthenticatedUser): void {
    if (!user.roles.includes('psicologo')) {
      throw new BadRequestException({
        error: 'PSYCHOLOGIST_REQUIRED',
        message: 'Solo un psicólogo puede gestionar su propio schedule',
      });
    }
  }
}
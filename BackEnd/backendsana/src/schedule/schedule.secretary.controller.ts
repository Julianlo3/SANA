import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { OriginGuard } from '../guards/origin.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { Roles } from '../middlewares/roles.decorator.js';
import { UserRole } from '../models/user-role.enum.js';
import { ScheduleService } from './schedule.service.js';
import { ScheduleAvailabilityQueryDto } from './dto/schedule-availability-query.dto.js';

/**
 * Controller for handling scheduling-related HTTP requests for secretaries.
 */
@Controller('schedule')
@UseGuards(OriginGuard, JwtAuthGuard, RolesGuard)
@Roles(UserRole.Secretary)
export class ScheduleSecretaryController {
  constructor(private readonly scheduleService: ScheduleService) {}

  /**
   * Finds schedule blocks for a psychologist selected by the secretary.
   * @param psychologistId The ID of the psychologist whose blocks are requested.
   * @returns A promise resolving to the psychologist's schedule blocks.
   */
  @Get('psychologists/:psychologistId/blocks')
  findPsychologistBlocks(
    @Param('psychologistId', ParseIntPipe) psychologistId: number,
  ) {
    return this.scheduleService.findPsychologistBlocks(psychologistId);
  }

  /**
   * Retrieves availability and occupied intervals for a psychologist's calendar.
   * @param psychologistId The ID of the psychologist whose calendar is requested.
   * @returns Availability and occupancy in separate collections.
   */
  @Get('psychologists/:psychologistId/calendar')
  findPsychologistCalendar(
    @Param('psychologistId', ParseIntPipe) psychologistId: number,
  ) {
    return this.scheduleService.findPsychologistCalendar(psychologistId);
  }

  /**
   * Finds available time slots for scheduling appointments.
   * @param query The query parameters for finding availability.
   * @returns A promise resolving to the available time slots.
   */
  @Get('availability')
  findAvailability(@Query() query: ScheduleAvailabilityQueryDto) {
    return this.scheduleService.findAvailability(query);
  }
}

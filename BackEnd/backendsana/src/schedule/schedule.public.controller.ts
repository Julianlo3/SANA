import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OriginGuard } from '../guards/origin.guard.js';
import { RateLimitGuard } from '../guards/rate-limit.guard.js';
import { RateLimit } from '../middlewares/rate-limit.decorator.js';
import { ScheduleService } from './schedule.service.js';
import { PublicScheduleAvailabilityQueryDto } from './dto/public-schedule-availability-query.dto.js';

/**
 * Controller for public schedule availability queries for consultants.
 * Returns only dates and time ranges in summary, without psychologist information.
 */
@Controller('schedule')
@UseGuards(OriginGuard)
export class SchedulePublicController {
  constructor(private readonly scheduleService: ScheduleService) {}

  /**
   * Retrieves summarized available schedule slots for consultants without psychologist information.
   * @param query The query parameters (appointmentStart, duration, delayHours).
   * @returns Summarized available slots (date, startTime, endTime).
   */
  @Get('public-availability')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 60, windowSeconds: 60 })
  findPublicAvailability(@Query() query: PublicScheduleAvailabilityQueryDto) {
    return this.scheduleService.findPublicAvailability(query);
  }
}


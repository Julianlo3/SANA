import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { OriginGuard } from '../guards/origin.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import type { AuthenticatedUser } from '../interfaces/auth.interface.js';
import { Roles } from '../middlewares/roles.decorator.js';
import { UserRole } from '../models/user-role.enum.js';
import { ScheduleService } from './schedule.service.js';
import { PolicyService } from '../policy/policy.service.js';
import { CreateScheduleBlockDto } from './dto/create-schedule-block.dto.js';
import { CreateRecurringScheduleBlockDto } from './dto/create-recurring-schedule-block.dto.js';

/**
 * Controller for managing schedule blocks and recurring schedule blocks for psychologists.
 */
@Controller('schedule')
@UseGuards(OriginGuard, JwtAuthGuard, RolesGuard)
@Roles(UserRole.Psychologist)
export class ScheduleController {
  constructor(
    private readonly scheduleService: ScheduleService,
    private readonly policyService: PolicyService,
  ) {}

  /**
   * Finds all schedule blocks for the authenticated psychologist.
   * @param request The HTTP request object containing the authenticated user.
   * @returns A promise that resolves to the list of schedule blocks.
   */
  @Get('me/blocks')
  findMyBlocks(@Req() request: Request & { user: AuthenticatedUser }) {
    return this.scheduleService.findMyBlocks(request.user);
  }

  /**
   * Creates a new schedule block for the authenticated psychologist.
   * @param request The HTTP request object containing the authenticated user.
   * @param dto The data transfer object for creating the schedule block.
   * @returns A promise that resolves to the created schedule block.
   */
  @Post('me/blocks')
  @HttpCode(HttpStatus.CREATED)
  createMyBlock(
    @Req() request: Request & { user: AuthenticatedUser },
    @Body() dto: CreateScheduleBlockDto,
  ) {
    return this.scheduleService.createMyBlock(request.user, dto);
  }

  /**
   * Deletes a schedule block for the authenticated psychologist.
   * @param request The HTTP request object containing the authenticated user.
   * @param id The ID of the schedule block to delete.
   */
  @Delete('me/blocks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMyBlock(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.scheduleService.deleteMyBlock(request.user, id);
  }

  /**
   * Finds all recurring schedule blocks for the authenticated psychologist.
   * @param request The HTTP request object containing the authenticated user.
   * @returns A promise that resolves to the list of recurring schedule blocks.
   */
  @Get('me/recurring-blocks')
  findMyRecurringBlocks(@Req() request: Request & { user: AuthenticatedUser }) {
    return this.scheduleService.findMyRecurringBlocks(request.user);
  }

  /**
   * Creates a new recurring schedule block for the authenticated psychologist.
   * @param request The HTTP request object containing the authenticated user.
   * @param dto The data transfer object for creating the recurring schedule block.
   * @returns A promise that resolves to the created recurring schedule block.
   */
  @Post('me/recurring-blocks')
  @HttpCode(HttpStatus.CREATED)
  createMyRecurringBlock(
    @Req() request: Request & { user: AuthenticatedUser },
    @Body() dto: CreateRecurringScheduleBlockDto,
  ) {
    return this.scheduleService.createMyRecurringBlock(request.user, dto);
  }

  /**
   * Deletes a recurring schedule block for the authenticated psychologist.
   * @param request The HTTP request object containing the authenticated user.
   * @param id The ID of the recurring schedule block to delete.
   * @returns A promise that resolves when the block is deleted.
   */
  @Delete('me/recurring-blocks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMyRecurringBlock(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.scheduleService.deleteMyRecurringBlock(request.user, id);
  }

  /**
   * Accepts schedule terms for the authenticated psychologist.
   * @param request The HTTP request object containing the authenticated user.
   * @returns A promise that resolves when the terms are accepted.
   */
  @Post('me/accept-terms')
  @HttpCode(HttpStatus.NO_CONTENT)
  async acceptScheduleTerms(
    @Req() request: Request & { user: AuthenticatedUser },
  ): Promise<void> {
    const ipAddress = request.ip || request.socket.remoteAddress;
    await this.policyService.recordPsychologistScheduleTermsAcceptance(
      request.user.personId,
      ipAddress,
    );
  }

  /**
   * Checks if the authenticated psychologist has accepted schedule terms.
   * @param request The HTTP request object containing the authenticated user.
   * @returns A promise that resolves to the acceptance status.
   */
  @Get('me/terms-status')
  async getTermsStatus(
    @Req() request: Request & { user: AuthenticatedUser },
  ): Promise<{ hasAccepted: boolean }> {
    const hasAccepted = await this.policyService.hasPsychologistAcceptedScheduleTerms(
      request.user.personId,
    );
    return { hasAccepted };
  }
}
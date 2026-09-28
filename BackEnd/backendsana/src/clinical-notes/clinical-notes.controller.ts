import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
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
import { ClinicalNotesService } from './clinical-notes.service.js';
import { RegisterAttentionDto } from './dto/register-attention.dto.js';

/**
 * Controller for managing clinical notes
 * Access restricted to psychologists only
 */
@Controller('clinical-notes')
@UseGuards(OriginGuard, JwtAuthGuard, RolesGuard)
@Roles(UserRole.Psychologist)
export class ClinicalNotesController {
  private readonly logger = new Logger(ClinicalNotesController.name);

  constructor(private readonly clinicalNotesService: ClinicalNotesService) { }

  /**
   * Registers attention with optional observation for a completed appointment
   * @param request The HTTP request
   * @param dto The registration data
   * @returns The created clinical note
   */
  @Post('register-attention')
  @HttpCode(HttpStatus.CREATED)
  registerAttention(
    @Req() request: Request & { user: AuthenticatedUser },
    @Body() dto: RegisterAttentionDto,
  ) {
    this.logger.log(
      `Module:clinical-notes, Function:registerAttention, result-start: appId-${dto.appId}, psychologistId-${request.user.userId}`,
    );
    return this.clinicalNotesService.registerAttention(dto, request.user.userId, request);
  }

  /**
   * Gets clinical notes for a specific appointment with access control
   * @param request The HTTP request
   * @param appId The appointment ID
   * @returns Array of clinical notes
   */
  @Get('appointment/:appId')
  findByAppointment(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('appId', ParseIntPipe) appId: number,
  ) {
    return this.clinicalNotesService.findByAppointment(appId, request.user.userId);
  }

  /**
   * Gets clinical notes history for a consultant with access control
   * @param request The HTTP request
   * @param requesterId The consultant (requester) ID
   * @returns The consultant's attention history
   */
  @Get('consultant/:requesterId/history')
  findConsultantHistory(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('requesterId', ParseIntPipe) requesterId: number,
  ) {
    return this.clinicalNotesService.findConsultantHistory(requesterId, request.user.userId);
  }

  /**
   * Gets a clinical note by ID with access control
   * @param request The HTTP request
   * @param cnId The clinical note ID
   * @returns The clinical note
   */
  @Get(':cnId')
  findOne(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('cnId', ParseIntPipe) cnId: number,
  ) {
    return this.clinicalNotesService.findById(cnId, request.user.userId);
  }

  /**
   * Gets audit history for a clinical note with access control
   * @param request The HTTP request
   * @param cnId The clinical note ID
   * @returns Array of audit entries
   */
  @Get(':cnId/audit')
  findAuditHistory(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('cnId', ParseIntPipe) cnId: number,
  ) {
    return this.clinicalNotesService.findAuditHistory(cnId, request.user.userId);
  }
}

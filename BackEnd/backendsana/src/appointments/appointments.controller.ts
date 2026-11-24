import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { OriginGuard } from '../guards/origin.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import type { AuthenticatedUser } from '../auth/auth.interface.js';
import { Roles } from '../middlewares/roles.decorator.js';
import { UserRole } from '../models/user-role.enum.js';
import { AppointmentsService } from './appointments.service.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { ConfirmAppointmentDto } from './dto/confirm-appointment.dto.js';
import { AssignAppointmentDto } from './dto/assign-appointment.dto.js';
import { DiscardAppointmentDto } from './dto/discard-appointment.dto.js';
import { ReferAppointmentDto } from './dto/refer-appointment.dto.js';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto.js';
import { PublicScheduleAvailabilityQueryDto } from '../schedule/dto/public-schedule-availability-query.dto.js';
import { RateLimit } from '../middlewares/rate-limit.decorator.js';
import { RateLimitGuard } from '../guards/rate-limit.guard.js';
import { ApiControllerDocs } from '../openapi/api-controller-docs.decorator.js';

/**
 * controller for handling appointment-related HTTP requests.
 */
@Controller('appointments')
@ApiControllerDocs('Appointments')
@UseGuards(OriginGuard)
export class AppointmentsController {
  private readonly logger = new Logger(AppointmentsController.name);

  constructor(private readonly appointmentsService: AppointmentsService) { }

  /**
   * Public endpoint: anyone can request an appointment, anonymously or with
   * an optional authenticated session for safe association with their account.
   * Can be requested for themselves or for a dependent minor.
   * @param dto The DTO containing the appointment request details.
   * @returns A promise resolving to the created appointment.
   */
  @Post('request')
  @UseGuards(OptionalJwtAuthGuard, RateLimitGuard)
  @RateLimit({ limit: 10, windowSeconds: 60 })
  @HttpCode(HttpStatus.CREATED)
  requestAppointment(
    @Body() dto: CreateAppointmentDto,
    @Req() request: Request & { user?: AuthenticatedUser },
  ) {
    this.logger.log(
      `Module:appointments, Function:requestAppointment, result-start: authenticated-${Boolean(request.user)}, patientType-${dto.patientType}, type-${dto.appType}`,
    );
    const ipAddress = request.ip || request.socket.remoteAddress;
    return this.appointmentsService.requestAppointment(dto, request.user, ipAddress);
  }

  /**
   * Public endpoint: Lists available slots summarized without psychologist information.
   * Can be queried by consultants to choose an appointment slot.
   * @param query Query parameters (appointmentStart, duration, delayHours).
   * @returns List of available summarized slots.
   */
  @Get('availability')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 60, windowSeconds: 60 })
  findAvailability(@Query() query: PublicScheduleAvailabilityQueryDto) {
    return this.appointmentsService.findPublicAvailability(query);
  }

  /**
   * Protected endpoint: Lists the valid family relationship catalog for the dependent flow.
   * This is a catalog of relationship types, not a list of dependents.
   * @returns A promise resolving to the list of available relationships.
   */
  @Get('relationships')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Psychologist)
  findRelationships() {
    return this.appointmentsService.findRelationships();
  }

  /**
   * Protected endpoint: Lists appointments (filterable by state).
   * Accessible by secretaries and administrators.
   * @param state The state to filter appointments by.
   * @returns A promise resolving to the list of appointments.
   */
  @Get()
  @ApiBearerAuth()
  @ApiQuery({
    name: 'state',
    required: false,
    description: 'Filter appointments by their current state.',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Secretary)
  findAll(@Query('state') state?: string) {
    return this.appointmentsService.findAll(state);
  }

  /**
   * Protected endpoint: Lists appointments requested by the authenticated consultant.
   * @param request The HTTP request object.
   * @returns A promise resolving to the list of requested appointments.
   */
  @Get('my-requests')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Requester)
  findMyRequests(@Req() request: Request & { user: AuthenticatedUser }) {
    return this.appointmentsService.findByRequester(request.user.personId);
  }

  /**
   * Protected endpoint: Allows an authenticated consultant to withdraw an unconfirmed request
   * or cancel their own confirmed appointment.
   * @param request The HTTP request object.
   * @param id The ID of the appointment to cancel.
   * @returns A promise resolving to the withdrawn or cancelled appointment.
   */
  @Patch(':id/cancel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Requester)
  cancelOwnAppointment(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    this.logger.log(
      `Module:appointments, Function:cancelOwnAppointment, result-start: appId-${id}, requesterId-${request.user.personId}`,
    );
    return this.appointmentsService.cancelOwnAppointment(
      id,
      request.user.personId,
    );
  }

  /**
   * Protected endpoint: Lists active psychologists for the assignment selector.
   * @returns A promise resolving to the list of available psychologists.
   */
  @Get('psychologists')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Secretary)
  findPsychologists() {
    return this.appointmentsService.findPsychologists();
  }

  /**
   * Protected endpoint: Secretary lists referred valuation appointments pending schedule assignment.
   * @param state Optional state filter ('remitida' by default, or 'asignada').
   * @returns A promise resolving to the list of referred valuation appointments.
   */
  @Get('referrals')
  @ApiBearerAuth()
  @ApiQuery({
    name: 'state',
    required: false,
    enum: ['remitida', 'asignada'],
    description: 'Filter referred valuation appointments by state (defaults to remitida).',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Secretary)
  findPendingReferrals(@Query('state') state?: 'remitida' | 'asignada') {
    return this.appointmentsService.findPendingReferrals(state ?? 'remitida');
  }

  /**
   * Protected endpoint: Psychologist lists active psychologists (with their specialities)
   * eligible to receive a referral for a specific valuation appointment (excludes psychologists
   * already in the referral chain to prevent loops).
   * @param request The HTTP request object.
   * @param id The valuation appointment ID.
   * @returns A promise resolving to the list of eligible psychologists.
   */
  @Get(':id/referral-psychologists')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Psychologist)
  findReferralPsychologists(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.appointmentsService.findReferralPsychologists(
      id,
      request.user.personId,
    );
  }

  /**
   * Protected endpoint: Psychologist refers a valuation appointment to another psychologist.
   * Marks the current valuation as 'realizada' (with referredToPsychologistId) and creates
   * a new valuation in 'remitida' state awaiting secretary schedule assignment.
   * @param request The HTTP request object.
   * @param id The valuation appointment ID to refer.
   * @param dto The referral DTO containing targetPsychologistId and optional reason.
   * @returns A promise resolving to the source and referred appointments.
   */
  @Post(':id/refer')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Psychologist)
  @HttpCode(HttpStatus.CREATED)
  referAppointment(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReferAppointmentDto,
  ) {
    this.logger.log(
      `Module:appointments, Function:referAppointment, result-start: appId-${id}, psychologistId-${request.user.personId}, targetPsychologistId-${dto.targetPsychologistId}`,
    );
    return this.appointmentsService.referAppointment(
      id,
      dto,
      request.user.personId,
    );
  }

  /**
   * Protected endpoint: Psychologist marks an appointment as completed (realizada).
   * Must be defined before the general :id route to avoid conflicts
   * @param request The HTTP request object.
   * @param id The ID of the appointment to mark as completed.
   * @returns A promise resolving to the updated appointment.
   */
  @Patch(':id/complete')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Psychologist)
  markAsCompleted(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    this.logger.log(
      `Module:appointments, Function:markAsCompleted, result-start: appId-${id}, psychologistId-${request.user.personId}`,
    );
    return this.appointmentsService.markAsCompleted(id, request.user.personId);
  }

  /**
   * Protected endpoint: Psychologist marks an appointment as no-show (no_asistio).
   * @param request The HTTP request object.
   * @param id The ID of the appointment to mark as no-show.
   * @returns A promise resolving to the updated appointment.
   */
  @Patch(':id/no-show')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Psychologist)
  markAsNoShow(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    this.logger.log(
      `Module:appointments, Function:markAsNoShow, result-start: appId-${id}, psychologistId-${request.user.personId}`,
    );
    return this.appointmentsService.markAsNoShow(id, request.user.personId);
  }

  /**
   * Protected endpoint: Psychologist gets their assigned appointments.
   * Only returns accepted (confirmada) appointments by default, unless filtered by state.
   * @param request The HTTP request object.
   * @param state Optional state filter (confirmada, realizada, cancelada).
   * @returns A promise resolving to the list of appointments.
   */
  @Get('my-appointments')
  @ApiBearerAuth()
  @ApiQuery({
    name: 'state',
    required: false,
    enum: ['confirmada', 'realizada', 'cancelada'],
    description: 'Filter the psychologist appointments by state.',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Psychologist)
  findMyAppointments(
    @Req() request: Request & { user: AuthenticatedUser },
    @Query('state') state?: 'confirmada' | 'realizada' | 'cancelada',
  ) {
    return this.appointmentsService.findByPsychologist(request.user.personId, state);
  }

  /**
   * Protected endpoint: Gets single appointment details (including ideal date and reason).
   * @param id The ID of the appointment to find.
   * @returns A promise resolving to the appointment details.
   */
  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Secretary)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.findById(id);
  }

  /**
   * Protected endpoint: Secretary confirms an appointment request,
   * assigns the psychologist, the definitive date and time, and optional link.
   * @param request The HTTP request object.
   * @param id The ID of the appointment to confirm.
   * @param dto The DTO containing the confirmation details.
   * @returns A promise resolving to the confirmed appointment.
   */
  @Patch(':id/confirm')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Secretary)
  confirm(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConfirmAppointmentDto,
  ) {
    this.logger.log(
      `Module:appointments, Function:confirm, result-start: appId-${id}, secretaryUserId-${request.user.userId}, psyId-${dto.psyId}, appDate-${dto.appDate}`,
    );
    return this.appointmentsService.confirmAppointment(
      id,
      dto,
      request.user.personId,
    );
  }

  /**
   * Protected endpoint: Secretary assigns a psychologist to an appointment request.
   * @param request The HTTP request object.
   * @param id The ID of the appointment to assign.
   * @param dto The DTO containing the assignment details.
   * @returns A promise resolving to the assigned appointment.
   */
  @Patch(':id/assign')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Secretary)
  assign(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignAppointmentDto,
  ) {
    return this.appointmentsService.assignAppointment(
      id,
      dto,
      request.user.personId,
    );
  }

  /**
   * Protected endpoint: Secretary discards an appointment request.
   * @param request The HTTP request object.
   * @param id The ID of the appointment to discard.
   * @param dto The DTO containing the discard details.
   * @returns A promise resolving to the discarded appointment.
   */
  @Patch(':id/discard')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Secretary)
  discard(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DiscardAppointmentDto,
  ) {
    return this.appointmentsService.discardAppointment(id, dto, request.user.personId);
  }

  /**
   * Protected endpoint: Updates appointment status.
   * @param request The HTTP request object.
   * @param id The ID of the appointment to update.
   * @param dto The DTO containing the new status.
   * @returns A promise resolving to the updated appointment.
   */
  @Patch(':id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Secretary)
  updateStatus(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    this.logger.log(
      `Module:appointments, Function:updateStatus, result-start: appId-${id}, newState-${dto.state}`,
    );
    return this.appointmentsService.updateStatus(id, dto, request.user.personId);
  }

  /**
   * Protected endpoint: Gets psychologist history for the patient in an appointment.
   * The appointment identifies whether the patient is the requester or a dependent.
   * @param id The appointment ID.
   * @returns A promise resolving to the psychologist history for that patient.
   */
  @Get(':id/psychologist-history')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Secretary)
  findPatientPsychologistHistory(@Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.findPatientPsychologistHistory(id);
  }

  /**
   * Protected endpoint: Psychologist gets details of a specific appointment (includes appReason).
   * Only allows access to appointments assigned to the requesting psychologist.
   * @param request The HTTP request object.
   * @param id The ID of the appointment to find.
   * @returns A promise resolving to the appointment details.
   */
  @Get('my-appointments/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Psychologist)
  findMyAppointmentById(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.appointmentsService.findByIdForPsychologist(id, request.user.personId);
  }
}

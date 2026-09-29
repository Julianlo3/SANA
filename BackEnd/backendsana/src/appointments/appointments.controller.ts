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
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { OriginGuard } from '../guards/origin.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import type { AuthenticatedUser } from '../interfaces/auth.interface.js';
import { Roles } from '../middlewares/roles.decorator.js';
import { UserRole } from '../models/user-role.enum.js';
import { AppointmentsService } from './appointments.service.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { ConfirmAppointmentDto } from './dto/confirm-appointment.dto.js';
import { AssignAppointmentDto } from './dto/assign-appointment.dto.js';
import { DiscardAppointmentDto } from './dto/discard-appointment.dto.js';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto.js';

/**
 * controller for handling appointment-related HTTP requests.
 */
@Controller('appointments')
@UseGuards(OriginGuard)
export class AppointmentsController {
  private readonly logger = new Logger(AppointmentsController.name);

  constructor(private readonly appointmentsService: AppointmentsService) { }

  /**
   * Public endpoint: Consultant requests an appointment without logging in.
   * Can be requested for themselves or for a dependent minor.
   * @param dto The DTO containing the appointment request details.
   * @returns A promise resolving to the created appointment.
   */
  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  requestAppointment(@Body() dto: CreateAppointmentDto) {
    this.logger.log(
      `Module:appointments, Function:requestAppointment, result-start: requesterDoc-${dto.requesterIdentityDocument}, cardType-${dto.requesterCardType}, patientType-${dto.patientType}, type-${dto.appType}`,
    );
    return this.appointmentsService.requestAppointment(dto);
  }

  /**
   * Protected endpoint: Lists the valid family relationship catalog for the dependent flow.
   * This is a catalog of relationship types, not a list of dependents.
   * @returns A promise resolving to the list of available relationships.
   */
  @Get('relationships')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Secretary)
  findAll(@Query('state') state?: string) {
    return this.appointmentsService.findAll(state);
  }

  /**
   * Protected endpoint: Lists active psychologists for the assignment selector.
   * @returns A promise resolving to the list of available psychologists.
   */
  @Get('psychologists')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Secretary)
  findPsychologists() {
    return this.appointmentsService.findPsychologists();
  }

  /**
   * Protected endpoint: Psychologist marks an appointment as completed (realizada).
   * Must be defined before the general :id route to avoid conflicts
   * @param request The HTTP request object.
   * @param id The ID of the appointment to mark as completed.
   * @returns A promise resolving to the updated appointment.
   */
  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Psychologist)
  markAsCompleted(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    this.logger.log(
      `Module:appointments, Function:markAsCompleted, result-start: appId-${id}, psychologistUserId-${request.user.userId}`,
    );
    return this.appointmentsService.markAsCompleted(id, request.user.userId);
  }

  /**
   * Protected endpoint: Gets single appointment details (including ideal date and reason).
   * @param id The ID of the appointment to find.
   * @returns A promise resolving to the appointment details.
   */
  @Get(':id')
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
      request.user.userId,
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
      request.user.userId,
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Secretary)
  discard(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DiscardAppointmentDto,
  ) {
    return this.appointmentsService.discardAppointment(id, dto, request.user.userId);
  }

  /**
   * Protected endpoint: Updates appointment status.
   * @param request The HTTP request object.
   * @param id The ID of the appointment to update.
   * @param dto The DTO containing the new status.
   * @returns A promise resolving to the updated appointment.
   */
  @Patch(':id/status')
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
    return this.appointmentsService.updateStatus(id, dto, request.user.userId);
  }

  /**
   * Protected endpoint: Gets psychologist history for a specific consultant.
   * Shows which psychologists have attended the consultant and their current streak.
   * @param consultantId The ID of the consultant (requester).
   * @returns A promise resolving to the psychologist history with streak information.
   */
  @Get('consultant/:consultantId/psychologist-history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Secretary)
  findConsultantPsychologistHistory(@Param('consultantId', ParseIntPipe) consultantId: number) {
    return this.appointmentsService.findConsultantPsychologistHistory(consultantId);
  }

  /**
   * Protected endpoint: Psychologist gets their assigned appointments.
   * Only returns accepted (confirmada) appointments by default, unless filtered by state.
   * @param request The HTTP request object.
   * @param state Optional state filter (confirmada, realizada, cancelada).
   * @returns A promise resolving to the list of appointments.
   */
  @Get('my-appointments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Psychologist)
  findMyAppointments(
    @Req() request: Request & { user: AuthenticatedUser },
    @Query('state') state?: 'confirmada' | 'realizada' | 'cancelada',
  ) {
    return this.appointmentsService.findByPsychologist(request.user.userId, state);
  }

  /**
   * Protected endpoint: Psychologist gets details of a specific appointment (includes appReason).
   * Only allows access to appointments assigned to the requesting psychologist.
   * @param request The HTTP request object.
   * @param id The ID of the appointment to find.
   * @returns A promise resolving to the appointment details.
   */
  @Get('my-appointments/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Psychologist)
  findMyAppointmentById(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.appointmentsService.findByIdForPsychologist(id, request.user.userId);
  }
}

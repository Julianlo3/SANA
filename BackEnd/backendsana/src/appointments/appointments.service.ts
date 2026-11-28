import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import type { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import type { CreateDependentDto } from './dto/create-dependent.dto.js';
import type { CreateDependentAppointmentDto } from './dto/create-dependent-appointment.dto.js';
import type { ConfirmAppointmentDto } from './dto/confirm-appointment.dto.js';
import type { AssignAppointmentDto } from './dto/assign-appointment.dto.js';
import type { DiscardAppointmentDto } from './dto/discard-appointment.dto.js';
import type { ReferAppointmentDto } from './dto/refer-appointment.dto.js';
import type { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto.js';
import {
  AppointmentsRepository,
  RequesterIdentityConflictError,
  calculateAge,
  type AppointmentRow,
  type PsychologistHistoryRow,
  type PsychologistOptionRow,
  type RequesterAppointmentRow,
  type RequesterDependentRow,
  type RelationshipRow,
} from './appointments.repository.js';
import { ScheduleService } from '../schedule/schedule.service.js';
import type { PublicScheduleAvailabilityQueryDto } from '../schedule/dto/public-schedule-availability-query.dto.js';
import type { PublicScheduleSlotDto } from '../schedule/dto/public-schedule-availability-response.dto.js';
import { EmailService } from '../email/email.service.js';
import { GoogleCalendarService } from '../calendar/google-calendar.service.js';
import {
  buildAppointmentRequestedEmail,
  buildAppointmentConfirmedPatientEmail,
  buildAppointmentAssignedPsychologistEmail,
  buildAppointmentCancelledEmail,
} from '../email/templates/index.js';
import type { AuthenticatedUser } from '../auth/auth.interface.js';
import { UserRole } from '../models/user-role.enum.js';
import { normalizeVulnerabilities } from '../users/vulnerabilities.js';

const REQUESTER_ALREADY_REGISTERED_MESSAGE =
  'No se pudo asociar la solicitud con esos datos. Verifique el correo y documento, o inicie sesión si ya tiene una cuenta.';
const REQUESTER_UNIQUE_CONSTRAINTS = new Set([
  'Person_email_uq',
  'Person_idocument_uq',
]);
const APPOINTMENT_REQUEST_ROLES = new Set<UserRole>([
  UserRole.Administrator,
  UserRole.Secretary,
  UserRole.Psychologist,
  UserRole.Marketing,
  UserRole.Requester,
]);

const DEPENDENT_UNIQUE_CONSTRAINTS = new Set(['Dependent_idocument_uq']);

/**
 * Service for managing appointments
 */
@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly repo: AppointmentsRepository,
    private readonly scheduleService: ScheduleService,
    @Optional() private readonly emailService?: EmailService,
    @Optional() private readonly calendarService?: GoogleCalendarService,
  ) { }

  /**
   * Requests a new appointment.
   * @param dto The data for creating the appointment.
   * @returns A promise resolving to the created appointment ID and a success message.
   */
  async requestAppointment(
    dto: CreateAppointmentDto,
    authenticatedUser?: AuthenticatedUser,
    ipAddress?: string,
  ): Promise<{ appId: number; message: string }> {
    if (
      authenticatedUser &&
      !authenticatedUser.roles.some((role) =>
        APPOINTMENT_REQUEST_ROLES.has(role as UserRole),
      )
    ) {
      throw new ForbiddenException('Account role is not authorized');
    }

    this.validateChannel(dto, authenticatedUser);
    this.validateRequester(dto);
    if (dto.patientType === 'dependent') {
      await this.validateDependent(dto);
    }
    const vulnerabilities = this.resolveVulnerabilities(dto);

    if (dto.appDate) {
      const appDateTime = new Date(dto.appDate).getTime();
      if (Number.isNaN(appDateTime) || appDateTime <= Date.now()) {
        throw new BadRequestException({
          error: 'INVALID_APPOINTMENT_DATE',
          message: 'La fecha de la cita debe ser posterior al momento actual',
        });
      }
    }

    let appId: number;
    try {
      appId = await this.repo.createRequest({
        requester: {
          name: dto.requesterName.trim(),
          cardType: dto.requesterCardType,
          identityDocument: dto.requesterIdentityDocument,
          contactNumber: dto.requesterContactNumber.trim(),
          email: dto.requesterEmail.trim().toLowerCase(),
          birthdate: dto.requesterBirthdate,
          gender: dto.requesterGender,
          termsAccepted: dto.requesterTermsAccepted,
          residenceZone: dto.residenceZone?.trim() ?? null,
          vulnerabilities,
        },
        dependent: dto.patientType === 'dependent'
          ? {
            name: dto.dependentName!.trim(),
            identityDocument: dto.dependentIdentityDocument!,
            birthdate: dto.dependentBirthdate!,
            gender: dto.dependentGender,
            termsAccepted: dto.dependentTermsAccepted!,
            relationshipId: dto.relationshipId!,
          }
          : null,
        appType: dto.appType,
        appReason: dto.appReason?.trim() ?? null,
        authenticatedPersonId: authenticatedUser?.personId,
        acceptance: { ipAddress: ipAddress ?? null, channel: 'web' },
        slot: dto.appDate
          ? {
            appDate: new Date(dto.appDate),
            duration: 60,
          }
          : null,
      });
    } catch (error) {
      if (
        error instanceof RequesterIdentityConflictError ||
        isRequesterUniqueConstraintViolation(error)
      ) {
        throw new ConflictException({
          error: 'REQUESTER_ALREADY_REGISTERED',
          message: REQUESTER_ALREADY_REGISTERED_MESSAGE,
        });
      }
      if (isDependentUniqueConstraintViolation(error)) {
        throw new ConflictException({
          error: 'DEPENDENT_BELONGS_TO_ANOTHER_REQUESTER',
          message:
            'Este documento de dependiente ya se encuentra registrado bajo otro acudiente. Si requiere actualizar la representación legal, comuníquese con secretaría.',
        });
      }
      throw error;
    }

    this.logger.log(
      `Module:appointments, Function:requestAppointment, result-success: appId-${appId}, authenticated-${Boolean(authenticatedUser)}, patientType-${dto.patientType}, type-${dto.appType}`,
    );
    if (dto.appDate) {
      // La primera cita ya queda confirmada al reservar una franja pública;
      // no debe pasar después por la aprobación de secretaría.
      const appointment = await this.repo.findById(appId);
      if (appointment) {
        await this.sendConfirmationNotification(appointment);
      }
    } else {
      await this.notifyRequesterOfNewRequest({
        appId,
        requesterName: dto.requesterName,
        requesterEmail: dto.requesterEmail,
        patientName:
          dto.patientType === 'dependent' ? dto.dependentName : dto.requesterName,
        appType: dto.appType,
      });
    }

    return {
      appId,
      message: dto.appDate
        ? 'Tu primera cita quedó asignada y confirmada con éxito.'
        : 'Solicitud de cita registrada con éxito. Un secretario revisará la solicitud y te contactará para confirmar la fecha.',
    };
  }

  /**
   * Lists minor dependents registered under the authenticated consultant along
   * with each dependent's current valuation eligibility.
   * @param requesterId The authenticated consultant's person ID.
   * @returns A promise resolving to the list of registered dependents.
   */
  async findMyDependents(requesterId: number): Promise<RequesterDependentRow[]> {
    return this.repo.findDependentsByRequester(requesterId);
  }

  /**
   * Registers a new minor dependent under the authenticated consultant's account.
   * @param dto The dependent registration data.
   * @param requesterId The authenticated consultant's person ID.
   * @returns A promise resolving to the newly registered dependent with eligibility details.
   */
  async registerDependent(
    dto: CreateDependentDto,
    requesterId: number,
  ): Promise<RequesterDependentRow> {
    const trimmedName = dto.name.trim();
    if (!trimmedName) {
      throw new BadRequestException({
        error: 'DEPENDENT_DATA_REQUIRED',
        message: 'Se requieren nombre, documento de identidad y fecha de nacimiento del menor',
      });
    }

    this.validateDependentBirthdate(dto.birthdate);

    const relationshipExists = await this.repo.relationshipExists(dto.relationshipId);
    if (!relationshipExists) {
      throw new BadRequestException({
        error: 'INVALID_RELATIONSHIP',
        message: 'El parentesco indicado no es válido',
      });
    }

    let depId: number;
    try {
      depId = await this.repo.createDependentForRequester({
        requesterId,
        name: trimmedName,
        identityDocument: dto.identityDocument.trim(),
        birthdate: dto.birthdate,
        gender: dto.gender,
        relationshipId: dto.relationshipId,
      });
    } catch (error) {
      if (isDependentUniqueConstraintViolation(error)) {
        throw new ConflictException({
          error: 'DEPENDENT_ALREADY_REGISTERED',
          message: 'Ya existe un dependiente registrado con ese documento de identidad.',
        });
      }
      throw error;
    }

    const dependent = await this.repo.findDependentByIdForRequester(requesterId, depId);
    if (!dependent) {
      throw new NotFoundException({
        error: 'DEPENDENT_NOT_FOUND',
        message: 'No se encontró el dependiente registrado',
      });
    }

    this.logger.log(
      `Module:appointments, Function:registerDependent, result-success: requesterId-${requesterId}, depId-${depId}, relationshipId-${dto.relationshipId}`,
    );
    return dependent;
  }

  /**
   * Requests a valuation appointment from the authenticated consultant's profile
   * for one of their registered minor dependents.
   * @param depId The registered dependent ID.
   * @param dto The dependent appointment request details.
   * @param authenticatedUser The authenticated consultant.
   * @param ipAddress Optional client IP address for policy acceptance logging.
   * @returns A promise resolving to the created appointment ID and confirmation message.
   */
  async requestDependentAppointment(
    depId: number,
    dto: CreateDependentAppointmentDto,
    authenticatedUser: AuthenticatedUser,
    ipAddress?: string,
  ): Promise<{ appId: number; message: string }> {
    if (!dto.dependentTermsAccepted) {
      throw new BadRequestException({
        error: 'DEPENDENT_TERMS_NOT_ACCEPTED',
        message: 'Debe aceptar la política de tratamiento de datos personales de menores de edad',
      });
    }

    if (dto.appDate) {
      const appDateTime = new Date(dto.appDate).getTime();
      if (Number.isNaN(appDateTime) || appDateTime <= Date.now()) {
        throw new BadRequestException({
          error: 'INVALID_APPOINTMENT_DATE',
          message: 'La fecha de la cita debe ser posterior al momento actual',
        });
      }
    }

    const created = await this.repo.createRequestForExistingDependent({
      requesterId: authenticatedUser.personId,
      depId,
      appType: dto.appType,
      appReason: dto.appReason?.trim() || null,
      dependentTermsAccepted: dto.dependentTermsAccepted,
      acceptance: { ipAddress: ipAddress ?? null, channel: 'web' },
      slot: dto.appDate
        ? {
          appDate: new Date(dto.appDate),
          duration: 60,
        }
        : null,
    });

    this.logger.log(
      `Module:appointments, Function:requestDependentAppointment, result-success: appId-${created.appId}, requesterId-${authenticatedUser.personId}, depId-${depId}, type-${dto.appType}`,
    );

    if (dto.appDate) {
      const appointment = await this.repo.findById(created.appId);
      if (appointment) {
        await this.sendConfirmationNotification(appointment);
      }
    } else {
      await this.notifyRequesterOfNewRequest({
        appId: created.appId,
        requesterName: created.requesterName,
        requesterEmail: created.requesterEmail,
        patientName: created.dependentName,
        appType: dto.appType,
      });
    }

    return {
      appId: created.appId,
      message: dto.appDate
        ? 'Tu primera cita quedó asignada y confirmada con éxito.'
        : 'Solicitud de cita registrada con éxito. Un secretario revisará la solicitud y te contactará para confirmar la fecha.',
    };
  }

  /**
   * Retrieves summarized available schedule slots for public / consultant view.
   * @param query Availability query parameters.
   * @returns Summarized schedule slots without psychologist information.
   */
  async findPublicAvailability(
    query: PublicScheduleAvailabilityQueryDto,
  ): Promise<PublicScheduleSlotDto[]> {
    return this.scheduleService.findPublicAvailability(query);
  }

  /**
   * Only a secretary may declare an assisted channel. The public form always
   * records the acceptance as 'web', because the requester is the one accepting.
   */
  private validateChannel(
    dto: CreateAppointmentDto,
    authenticatedUser?: AuthenticatedUser,
  ): void {
    if (!dto.channel || dto.channel === 'web') return;
    if (!authenticatedUser?.roles.includes(UserRole.Secretary)) {
      throw new ForbiddenException({
        error: 'CHANNEL_NOT_ALLOWED',
        message: 'Solo el rol secretario puede registrar una aceptación por un canal distinto a la web',
      });
    }
  }

  private resolveVulnerabilities(dto: CreateAppointmentDto): string[] | undefined {
    if (dto.vulnerabilities === undefined) return undefined;
    if (dto.patientType === 'dependent') {
      throw new BadRequestException({
        error: 'VULNERABILITIES_NOT_ALLOWED_FOR_DEPENDENT',
        message: 'La población vulnerable solo se registra cuando la cita es para la persona solicitante',
      });
    }
    return normalizeVulnerabilities(dto.vulnerabilities) ?? undefined;
  }

  private validateRequester(dto: CreateAppointmentDto): void {
    if (!dto.requesterTermsAccepted) {
      throw new BadRequestException({
        error: 'TERMS_NOT_ACCEPTED',
        message: 'Debe aceptar los términos y la política de tratamiento de datos personales para continuar',
      });
    }

    if (!dto.requesterBirthdate) {
      throw new BadRequestException({
        error: 'REQUESTER_BIRTHDATE_REQUIRED',
        message: 'La fecha de nacimiento del solicitante es obligatoria',
      });
    }

    if (calculateAge(dto.requesterBirthdate) < 18) {
      throw new BadRequestException({
        error: 'REQUESTER_MUST_BE_ADULT',
        message: 'La persona solicitante o acudiente debe ser mayor de edad',
      });
    }
  }

  private validateDependentBirthdate(birthdate: string): void {
    const normalized = birthdate.slice(0, 10);
    const parsed = new Date(`${normalized}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.getTime() > Date.now()) {
      throw new BadRequestException({
        error: 'INVALID_DEPENDENT_BIRTHDATE',
        message: 'La fecha de nacimiento del dependiente no puede ser futura',
      });
    }

    if (calculateAge(birthdate) >= 18) {
      throw new BadRequestException({
        error: 'DEPENDENT_MUST_BE_MINOR',
        message: 'El dependiente debe ser menor de edad',
      });
    }
  }

  private async validateDependent(dto: CreateAppointmentDto): Promise<void> {
    if (!dto.dependentName?.trim() || !dto.dependentIdentityDocument || !dto.dependentBirthdate) {
      throw new BadRequestException({
        error: 'DEPENDENT_DATA_REQUIRED',
        message: 'Se requieren nombre, documento de identidad y fecha de nacimiento del menor',
      });
    }

    if (dto.requesterIdentityDocument.trim() === dto.dependentIdentityDocument.trim()) {
      throw new BadRequestException({
        error: 'DEPENDENT_SAME_DOCUMENT_AS_REQUESTER',
        message: 'El documento de identidad del dependiente no puede ser igual al del solicitante',
      });
    }

    if (!dto.relationshipId) {
      throw new BadRequestException({
        error: 'DEPENDENT_RELATIONSHIP_REQUIRED',
        message: 'Debe indicar el parentesco entre el consultante y el dependiente',
      });
    }

    this.validateDependentBirthdate(dto.dependentBirthdate);

    const relationshipExists = await this.repo.relationshipExists(dto.relationshipId);
    if (!relationshipExists) {
      throw new BadRequestException({
        error: 'INVALID_RELATIONSHIP',
        message: 'El parentesco indicado no es válido',
      });
    }

    if (!dto.dependentTermsAccepted) {
      throw new BadRequestException({
        error: 'DEPENDENT_TERMS_NOT_ACCEPTED',
        message: 'Debe aceptar la política de tratamiento de datos personales de menores de edad',
      });
    }
  }

  /**
   * Confirms an appointment request by assigning a psychologist and setting the definitive date and time.
   * @param appId The ID of the appointment to confirm.
   * @param dto The DTO containing the confirmation details.
   * @param secretaryUserId The ID of the secretary performing the confirmation.
   * @returns A promise resolving to the confirmed appointment.
   */
  async confirmAppointment(
    appId: number,
    dto: ConfirmAppointmentDto,
    secretaryUserId: number,
  ): Promise<AppointmentRow> {
    const appointment = await this.findByIdOrFail(appId);

    // Validar que el secretario no gestione su propia cita
    if (appointment.requesterId === secretaryUserId) {
      throw new BadRequestException({
        error: 'SECRETARY_CANNOT_MANAGE_OWN_APPOINTMENT',
        message: 'Un secretario no puede gestionar su propia cita. Solicite que otro secretario gestione esta solicitud.',
      });
    }

    if (!['pendiente', 'asignada'].includes(appointment.appState)) {
      throw new BadRequestException({
        error: 'APPOINTMENT_NOT_CONFIRMABLE',
        message: 'Solo se pueden confirmar solicitudes pendientes o citas asignadas',
      });
    }

    if (appointment.appState === 'asignada' && appointment.psychologistId !== dto.psyId) {
      throw new BadRequestException({
        error: 'PSYCHOLOGIST_ASSIGNMENT_MISMATCH',
        message: 'La cita asignada debe confirmarse con el psicólogo actualmente seleccionado',
      });
    }

    if (appointment.appState === 'asignada' && (
      !appointment.appDate ||
      new Date(appointment.appDate).getTime() !== new Date(dto.appDate).getTime() ||
      appointment.appDuration !== dto.appDuration
    )) {
      throw new BadRequestException({
        error: 'APPOINTMENT_SLOT_MISMATCH',
        message: 'La franja confirmada debe coincidir con la franja asignada previamente',
      });
    }

    if (!dto.appDuration) {
      throw new BadRequestException({
        error: 'APPOINTMENT_DURATION_REQUIRED',
        message: 'La duración es obligatoria para confirmar la cita',
      });
    }
    if (!(await this.repo.findPsychologists()).some((psychologist) => psychologist.psyId === dto.psyId)) {
      throw new BadRequestException({
        error: 'PSYCHOLOGIST_NOT_AVAILABLE',
        message: 'El psicólogo no está activo o no puede ser seleccionado',
      });
    }
    if (appointment.requesterId === dto.psyId) {
      throw new BadRequestException({
        error: 'PSYCHOLOGIST_CANNOT_ATTEND_OWN_APPOINTMENT',
        message: 'Un psicólogo no puede ser asignado a su propia cita. Seleccione otro psicólogo.',
      });
    }

    const confirmed = await this.scheduleService.confirmAppointmentSlot({
      appId,
      secretaryUserId,
      psyId: dto.psyId,
      appDate: new Date(dto.appDate),
      appDuration: dto.appDuration,
    });
    if (!confirmed) {
      throw new ConflictException({
        error: 'SCHEDULE_SLOT_TAKEN',
        message: 'La franja seleccionada ya no está disponible',
      });
    }

    if (appointment.appState === 'pendiente') {
      await this.repo.recordAssignmentHistory({
        appId,
        oldPsyId: null,
        newPsyId: dto.psyId,
        secId: secretaryUserId,
        reason: null,
      });
    }

    const updated = await this.findByIdOrFail(appId);

    this.logger.log(
      `Module:appointments, Function:confirmAppointment, result-success: appId-${appId}, psyId-${dto.psyId}, secretaryUserId-${secretaryUserId}, appDate-${dto.appDate}`,
    );

    // Espacio preparado para notificaciones (WhatsApp y Correo)
    await this.sendConfirmationNotification(updated);

    return updated;
  }

  /**
   * Assigns a psychologist to an appointment request.
   * @param appId The ID of the appointment to assign.
   * @param dto The DTO containing the assignment details.
   * @param secretaryUserId The ID of the secretary performing the assignment.
   * @returns A promise resolving to the assigned appointment.
   */
  async assignAppointment(
    appId: number,
    dto: AssignAppointmentDto,
    secretaryUserId: number,
  ): Promise<AppointmentRow> {
    const appointment = await this.findByIdOrFail(appId);
      if (!['pendiente', 'remitida', 'asignada'].includes(appointment.appState)) {
        throw new BadRequestException({
          error: 'APPOINTMENT_NOT_ASSIGNABLE',
          message: 'Solo se pueden asignar solicitudes pendientes, valoraciones remitidas o reasignar solicitudes ya asignadas',
        });
      }

      // Validar que el secretario no gestione su propia cita
      if (appointment.requesterId === secretaryUserId) {
        throw new BadRequestException({
          error: 'SECRETARY_CANNOT_MANAGE_OWN_APPOINTMENT',
          message: 'Un secretario no puede gestionar su propia cita. Solicite que otro secretario gestione esta solicitud.',
        });
      }

      // Si es una valoración remitida, debe asignarse al psicólogo al que fue remitida
      if (
        appointment.appState === 'remitida' &&
        appointment.psychologistId !== null &&
        appointment.psychologistId !== dto.psyId
      ) {
        throw new BadRequestException({
          error: 'REFERRED_PSYCHOLOGIST_MISMATCH',
          message: 'La valoración remitida debe asignarse al psicólogo al que fue remitida',
        });
      }

      const psychologist = (await this.repo.findPsychologists()).find(
        (option) => option.psyId === dto.psyId,
      );
      if (!psychologist) {
        throw new BadRequestException({
          error: 'PSYCHOLOGIST_NOT_AVAILABLE',
          message: 'El psicólogo no está activo o no puede ser seleccionado',
        });
      }

      // Validar disponibilidad general del psicólogo
      const hasAvailability = await this.scheduleService.checkPsychologistAvailability(dto.psyId);
      if (!hasAvailability) {
        throw new BadRequestException({
          error: 'PSYCHOLOGIST_NO_GENERAL_AVAILABILITY',
          message: 'El psicólogo no tiene disponibilidad general registrada en el sistema',
        });
      }

      // Validar que el psicólogo no sea asignado a su propia cita
      if (appointment.requesterId === dto.psyId) {
        throw new BadRequestException({
          error: 'PSYCHOLOGIST_CANNOT_ATTEND_OWN_APPOINTMENT',
          message: 'Un psicólogo no puede ser asignado a su propia cita. Seleccione otro psicólogo.',
        });
      }

      // Validar doble asignación al mismo psicólogo
      if (appointment.appState === 'asignada' && appointment.psychologistId === dto.psyId) {
        throw new BadRequestException({
          error: 'ALREADY_ASSIGNED_TO_SAME_PSYCHOLOGIST',
          message: 'La cita ya está asignada a este psicólogo. Use la opción de reasignación para cambiar a otro psicólogo.',
        });
      }

      const oldPsyId = appointment.appState === 'asignada' ? appointment.psychologistId : null;

      const assignment = await this.scheduleService.assignAppointmentSlot({
        appId,
        secretaryUserId,
        psychologistId: dto.psyId,
        appDate: new Date(dto.appDate),
        duration: dto.appDuration,
        appType: dto.appType,
      });
      if (assignment === 'not_assignable') {
        throw new BadRequestException({
          error: 'APPOINTMENT_NOT_ASSIGNABLE',
          message: 'La solicitud ya no puede asignarse en su estado actual',
        });
      }
      if (assignment === 'slot_taken') {
        throw new ConflictException({
          error: 'SCHEDULE_SLOT_TAKEN',
          message: 'El psicólogo no está disponible en la franja seleccionada',
        });
      }

      // Registrar historial de cambio de asignación
      await this.repo.recordAssignmentHistory({
        appId,
        oldPsyId,
        newPsyId: dto.psyId,
        secId: secretaryUserId,
        reason: dto.reassignmentReason?.trim() ?? null,
      });

      return this.findByIdOrFail(appId);
    }

  /**
   * Discards an appointment request.
   * @param appId The ID of the appointment to discard.
   * @param dto The DTO containing the discard details.
   * @param secretaryUserId The ID of the secretary performing the discard.
   * @returns A promise resolving to the discarded appointment.
   */
  async discardAppointment(
      appId: number,
      dto: DiscardAppointmentDto,
      secretaryUserId: number,
    ): Promise < AppointmentRow > {
      const appointment = await this.findByIdOrFail(appId);

      // Validar que el secretario no gestione su propia cita
      if(appointment.requesterId === secretaryUserId) {
      throw new BadRequestException({
        error: 'SECRETARY_CANNOT_MANAGE_OWN_APPOINTMENT',
        message: 'Un secretario no puede gestionar su propia cita. Solicite que otro secretario gestione esta solicitud.',
      });
    }

    try {
      await this.repo.discard(appId, dto.reason.trim());
    } catch (error) {
      if ((error as Error).message === 'APPOINTMENT_NOT_DISCARDABLE') {
        throw new BadRequestException({
          error: 'APPOINTMENT_NOT_DISCARDABLE',
          message: 'La solicitud ya no puede descartarse en su estado actual',
        });
      }
      throw error;
    }
    return this.findByIdOrFail(appId);
  }

  /**
   * Updates an appointment's status (cancelada / no_asistio).
   * @param appId The ID of the appointment to update.
   * @param dto The DTO containing the status details.
   * @param secretaryUserId The ID of the secretary performing the update.
   * @returns A promise resolving to the updated appointment.
   */
  async updateStatus(
    appId: number,
    dto: UpdateAppointmentStatusDto,
    secretaryUserId: number,
  ): Promise<AppointmentRow> {
    const appointment = await this.findByIdOrFail(appId);

    // Validar que el secretario no gestione su propia cita
    if (appointment.requesterId === secretaryUserId) {
      throw new BadRequestException({
        error: 'SECRETARY_CANNOT_MANAGE_OWN_APPOINTMENT',
        message: 'Un secretario no puede gestionar su propia cita. Solicite que otro secretario gestione esta solicitud.',
      });
    }

    if (!['cancelada', 'no_asistio'].includes(dto.state)) {
      throw new BadRequestException({
        error: 'INVALID_APPOINTMENT_STATUS_TRANSITION',
        message: 'El secretario solo puede cancelar citas o registrar una inasistencia',
      });
    }

    if (appointment.appState !== 'confirmada') {
      if (['cancelada', 'realizada', 'descartada', 'no_asistio'].includes(appointment.appState)) {
        throw new BadRequestException({
          error: 'APPOINTMENT_ALREADY_CLOSED',
          message: `La cita ya se encuentra en estado '${appointment.appState}' y no puede modificarse`,
        });
      }
      throw new BadRequestException({
        error: 'APPOINTMENT_NOT_CONFIRMED',
        message: 'Solo se pueden cancelar citas o registrar inasistencias cuando la cita está confirmada',
      });
    }

    const transitioned = await this.repo.updateState(appId, dto.state);
    if (!transitioned) {
      throw new ConflictException({
        error: 'APPOINTMENT_STATE_CHANGED',
        message: 'La cita cambió de estado y ya no puede actualizarse',
      });
    }
    const updated = await this.findByIdOrFail(appId);
    this.logger.log(
      `Module:appointments, Function:updateStatus, result-success: appId-${appId}, newState-${dto.state}`,
    );
    if (dto.state === 'cancelada') await this.sendCancellationNotification(updated);
    return updated;
  }

  /**
   * Cancels an appointment requested by the authenticated user.
   * @param appId The ID of the appointment to cancel.
   * @param requesterPersonId The ID of the person requesting the cancellation.
   * @returns A promise resolving to the cancelled appointment.
   */
  async cancelOwnAppointment(
    appId: number,
    requesterPersonId: number,
  ): Promise<AppointmentRow> {
    const appointment = await this.findByIdOrFail(appId);
    if (appointment.requesterId !== requesterPersonId) {
      throw new ForbiddenException({
        error: 'APPOINTMENT_NOT_REQUESTED_BY_USER',
        message: 'Solo puede cancelar citas solicitadas por su cuenta',
      });
    }

    let transitioned: boolean;
    const isConfirmed = appointment.appState === 'confirmada';
    if (isConfirmed) {
      transitioned = await this.repo.cancelByRequester(
        appId,
        requesterPersonId,
      );
    } else if (['pendiente', 'remitida', 'asignada'].includes(appointment.appState)) {
      transitioned = await this.repo.discardByRequester(
        appId,
        requesterPersonId,
      );
    } else if (['cancelada', 'realizada', 'descartada'].includes(appointment.appState)) {
      throw new BadRequestException({
        error: 'APPOINTMENT_ALREADY_CLOSED',
        message: `La cita ya se encuentra en estado '${appointment.appState}' y no puede modificarse`,
      });
    } else {
      throw new BadRequestException({
        error: 'APPOINTMENT_NOT_CANCELLABLE',
        message: 'Solo puede retirar solicitudes pendientes o asignadas, o cancelar citas confirmadas',
      });
    }

    if (!transitioned) {
      throw new ConflictException({
        error: 'APPOINTMENT_STATE_CHANGED',
        message: 'La cita cambió de estado y ya no puede retirarse o cancelarse',
      });
    }

    const updated = await this.findByIdOrFail(appId);
    this.logger.log(
      `Module:appointments, Function:cancelOwnAppointment, result-success: appId-${appId}, requesterId-${requesterPersonId}`,
    );
    if (isConfirmed) {
      await this.sendCancellationNotification(updated);
    }
    return updated;
  }

  /**
   * Finds all appointments with an optional state filter.
   * @param state The state to filter appointments by.
   * @returns A promise resolving to the list of appointments.
   */
  async findAll(state?: string): Promise<AppointmentRow[]> {
    return this.repo.findAll(state);
  }

  /**
   * Finds appointments requested by a specific requester.
   * @param requesterId The ID of the requester.
   * @returns A promise resolving to the list of requested appointments.
   */
  async findByRequester(
    requesterId: number,
  ): Promise<RequesterAppointmentRow[]> {
    return await this.repo.findByRequester(requesterId);
  }

  /**
   * Gets details of a single appointment.
   * @param appId The ID of the appointment to find.
   * @returns A promise resolving to the appointment details.
   */
  async findById(appId: number): Promise<AppointmentRow> {
    return this.findByIdOrFail(appId);
  }

  /**
   * Finds appointments for a specific psychologist (includes appReason).
   * Only returns appointments that are accepted (confirmada) and not completed (not realizada).
   * @param psychologistId The ID of the psychologist.
   * @param state Optional state filter.
   * @returns A promise resolving to the list of appointments.
   */
  async findByPsychologist(
    psychologistId: number,
    state: 'confirmada' | 'realizada' | 'cancelada' = 'confirmada',
  ): Promise<AppointmentRow[]> {
    return this.repo.findByPsychologist(psychologistId, state);
  }

  /**
   * Gets details of a single appointment for psychologist (includes appReason).
   * @param appId The ID of the appointment to find.
   * @param psychologistId The ID of the psychologist requesting the appointment.
   * @returns A promise resolving to the appointment details.
   */
  async findByIdForPsychologist(
    appId: number,
    psychologistId: number,
  ): Promise<AppointmentRow> {
    const appointment = await this.repo.findByIdForPsychologist(appId);
    if (!appointment) {
      throw new NotFoundException(`No existe una cita con ID ${appId}`);
    }

    // Verificar que la cita le pertenece a este psicólogo
    if (appointment.psychologistId !== psychologistId) {
      throw new ForbiddenException({
        error: 'NOT_ASSIGNED_PSYCHOLOGIST',
        message: 'Esta cita no está asignada a usted',
      });
    }

    return appointment;
  }

  /**
   * Lists active psychologists for appointment assignment.
   * @returns A promise resolving to the list of available psychologists.
   */
  async findPsychologists(): Promise<PsychologistOptionRow[]> {
    return this.repo.findPsychologists();
  }

  /**
   * Lists available relationships for minors.
   * @returns A promise resolving to the list of available relationships.
   */
  async findRelationships(): Promise<RelationshipRow[]> {
    return this.repo.findRelationships();
  }

  /**
   * Finds psychologist history for the patient on a specific appointment.
   * @param appId The appointment ID used to identify the patient.
   * @returns A promise resolving to that patient's psychologist history.
   */
  async findPatientPsychologistHistory(
    appId: number,
  ): Promise<PsychologistHistoryRow[]> {
    await this.findByIdOrFail(appId);
    return this.repo.findPatientPsychologistHistory(appId);
  }

  /**
   * Finds an appointment by ID or throws a 404 error.
   * @param appId The ID of the appointment to find.
   * @returns A promise resolving to the appointment details.
   */
  private async findByIdOrFail(appId: number): Promise<AppointmentRow> {
    const row = await this.repo.findById(appId);
    if (!row) {
      throw new NotFoundException(`No existe una cita con ID ${appId}`);
    }
    return row;
  }

  /**
   * Marks an appointment as completed (realizada).
   * @param appId The ID of the appointment to mark as completed.
   * @param psychologistId The ID of the psychologist marking it as completed.
   * @returns A promise resolving to the updated appointment.
   */
  async markAsCompleted(
    appId: number,
    psychologistId: number,
  ): Promise<AppointmentRow> {
    const appointment = await this.findByIdOrFail(appId);

    // Verificar que la cita le pertenece a este psicólogo
    if (appointment.psychologistId !== psychologistId) {
      throw new BadRequestException({
        error: 'NOT_ASSIGNED_PSYCHOLOGIST',
        message: 'Solo el psicólogo asignado puede marcar la cita como realizada',
      });
    }

    // Verificar que la cita está en un estado que se puede marcar como realizada
    if (appointment.appState !== 'confirmada') {
      throw new BadRequestException({
        error: 'APPOINTMENT_NOT_CONFIRMED',
        message: 'Solo se pueden marcar como realizadas las citas que están confirmadas',
      });
    }

    const transitioned = await this.repo.updateState(appId, 'realizada');
    if (!transitioned) {
      throw new ConflictException({
        error: 'APPOINTMENT_STATE_CHANGED',
        message: 'La cita cambió de estado y ya no puede marcarse como realizada',
      });
    }
    const updated = await this.findByIdOrFail(appId);

    try {
      await this.repo.autoCompleteCarePackage(appId);
    } catch (e) {
      this.logger.warn(`Failed to auto-complete care package for appId-${appId}: ${e}`);
    }

    this.logger.log(
      `Module:appointments, Function:markAsCompleted, result-success: appId-${appId}, psychologistId-${psychologistId}`,
    );

    return updated;
  }

  /**
   * Protected endpoint: Psychologist marks an appointment as no-show (no_asistio).
   * @param appId The ID of the appointment to mark as no-show.
   * @param psychologistId The ID of the psychologist marking it.
   * @returns A promise resolving to the updated appointment.
   */
  async markAsNoShow(
    appId: number,
    psychologistId: number,
  ): Promise<AppointmentRow> {
    const appointment = await this.findByIdOrFail(appId);

    if (appointment.psychologistId !== psychologistId) {
      throw new BadRequestException({
        error: 'NOT_ASSIGNED_PSYCHOLOGIST',
        message: 'Solo el psicólogo asignado puede registrar la inasistencia a la cita',
      });
    }

    if (appointment.appState !== 'confirmada') {
      throw new BadRequestException({
        error: 'APPOINTMENT_NOT_CONFIRMED',
        message: 'Solo se pueden registrar inasistencias en citas confirmadas',
      });
    }

    const transitioned = await this.repo.updateState(appId, 'no_asistio');
    if (!transitioned) {
      throw new ConflictException({
        error: 'APPOINTMENT_STATE_CHANGED',
        message: 'La cita cambió de estado y ya no puede marcarse como no asistida',
      });
    }
    const updated = await this.findByIdOrFail(appId);

    this.logger.log(
      `Module:appointments, Function:markAsNoShow, result-success: appId-${appId}, psychologistId-${psychologistId}`,
    );

    return updated;
  }

  /**
   * Lists active psychologists with their specialities eligible to receive a referral
   * from a given valuation appointment. Excludes the current psychologist, any psychologist
   * already in the referral chain (preventing loops), and the requester themselves.
   * @param appId The valuation appointment ID.
   * @param psychologistId The ID of the psychologist requesting the candidate list.
   * @returns Eligible psychologists with their specialities.
   */
  async findReferralPsychologists(
    appId: number,
    psychologistId: number,
  ): Promise<PsychologistOptionRow[]> {
    const appointment = await this.findByIdOrFail(appId);
    if (appointment.psychologistId !== psychologistId) {
      throw new ForbiddenException({
        error: 'NOT_ASSIGNED_PSYCHOLOGIST',
        message: 'Solo el psicólogo asignado a la valoración puede consultar psicólogos para remisión',
      });
    }
    if (appointment.appKind !== 'valoracion') {
      throw new BadRequestException({
        error: 'ASSESSMENT_REQUIRED',
        message: 'Solo las citas de valoración pueden ser remitidas a otro psicólogo',
      });
    }

    const candidates = await this.repo.findReferralCandidatePsychologists(appId);
    return candidates.filter((psy) => psy.psyId !== appointment.requesterId);
  }

  /**
   * Refers a valuation appointment to another psychologist.
   * Marks the current valuation as 'realizada' (recording the referred psychologist and reason)
   * and creates a new valuation appointment in 'remitida' state awaiting secretary schedule assignment.
   * @param appId The current valuation appointment ID.
   * @param dto The referral details (targetPsychologistId, optional reason).
   * @param psychologistId The ID of the psychologist performing the referral.
   * @returns The updated original valuation and the newly created referred valuation.
   */
  async referAppointment(
    appId: number,
    dto: ReferAppointmentDto,
    psychologistId: number,
  ): Promise<{
    sourceAppointment: AppointmentRow;
    referredAppointment: AppointmentRow;
  }> {
    if (dto.targetPsychologistId === psychologistId) {
      throw new BadRequestException({
        error: 'CANNOT_REFER_TO_SELF',
        message: 'No puede remitir la valoración a sí mismo',
      });
    }

    const activePsychologists = await this.repo.findPsychologists();
    const targetPsychologist = activePsychologists.find(
      (psy) => psy.psyId === dto.targetPsychologistId,
    );
    if (!targetPsychologist) {
      throw new BadRequestException({
        error: 'PSYCHOLOGIST_NOT_AVAILABLE',
        message: 'El psicólogo seleccionado para la remisión no está activo o no existe',
      });
    }

    let result: { sourceAppId: number; referredAppId: number };
    try {
      result = await this.repo.createReferral({
        sourceAppId: appId,
        psychologistId,
        targetPsychologistId: dto.targetPsychologistId,
        reason: dto.reason?.trim() || null,
      });
    } catch (error) {
      const code = (error as Error).message;
      if (code === 'APPOINTMENT_NOT_FOUND') {
        throw new NotFoundException(`No existe una cita con ID ${appId}`);
      }
      if (code === 'NOT_ASSIGNED_PSYCHOLOGIST') {
        throw new ForbiddenException({
          error: 'NOT_ASSIGNED_PSYCHOLOGIST',
          message: 'Solo el psicólogo asignado a la valoración puede remitir al paciente',
        });
      }
      if (code === 'ASSESSMENT_REQUIRED') {
        throw new BadRequestException({
          error: 'ASSESSMENT_REQUIRED',
          message: 'Solo se pueden remitir citas de valoración',
        });
      }
      if (code === 'INVALID_APPOINTMENT_STATE') {
        throw new BadRequestException({
          error: 'INVALID_APPOINTMENT_STATE',
          message: 'La valoración debe estar confirmada o realizada para poder remitirse',
        });
      }
      if (code === 'APPOINTMENT_ALREADY_REFERRED') {
        throw new ConflictException({
          error: 'APPOINTMENT_ALREADY_REFERRED',
          message: 'Esta valoración ya fue remitida a otro psicólogo',
        });
      }
      if (code === 'PACKAGE_ALREADY_EXISTS_FOR_ASSESSMENT') {
        throw new ConflictException({
          error: 'PACKAGE_ALREADY_EXISTS',
          message: 'No se puede remitir una valoración que ya tiene un paquete sugerido o creado',
        });
      }
      if (code === 'ACTIVE_CARE_PACKAGE_EXISTS') {
        throw new ConflictException({
          error: 'ACTIVE_CARE_PACKAGE_EXISTS',
          message: 'El paciente ya cuenta con un paquete activo',
        });
      }
      if (code === 'PSYCHOLOGIST_CANNOT_ATTEND_OWN_APPOINTMENT') {
        throw new BadRequestException({
          error: 'PSYCHOLOGIST_CANNOT_ATTEND_OWN_APPOINTMENT',
          message: 'Un psicólogo no puede ser remitido a su propia cita',
        });
      }
      if (code === 'REFERRAL_LOOP_DETECTED') {
        throw new BadRequestException({
          error: 'REFERRAL_LOOP_DETECTED',
          message: 'No se puede remitir a un psicólogo que ya atendió o remitió previamente esta valoración',
        });
      }
      throw error;
    }

    const sourceAppointment = await this.findByIdOrFail(result.sourceAppId);
    const referredAppointment = await this.findByIdOrFail(result.referredAppId);

    this.logger.log(
      `Module:appointments, Function:referAppointment, result-success: sourceAppId-${result.sourceAppId}, referredAppId-${result.referredAppId}, fromPsyId-${psychologistId}, toPsyId-${dto.targetPsychologistId}`,
    );

    return {
      sourceAppointment,
      referredAppointment,
    };
  }

  /**
   * Lists valuation appointments that have been referred and are pending schedule assignment
   * (or provisional confirmation) by the secretary.
   * @param state Optional filter ('remitida' by default, or 'asignada').
   * @returns List of referred appointments.
   */
  async findPendingReferrals(
    state: 'remitida' | 'asignada' = 'remitida',
  ): Promise<AppointmentRow[]> {
    if (!['remitida', 'asignada'].includes(state)) {
      throw new BadRequestException({
        error: 'INVALID_REFERRAL_STATE_FILTER',
        message: "El filtro de estado para remisiones debe ser 'remitida' o 'asignada'",
      });
    }
    return this.repo.findPendingReferrals(state);
  }

  private async notifyRequesterOfNewRequest(params: {
    appId: number;
    requesterName: string;
    requesterEmail?: string | null;
    patientName?: string | null;
    appType: string;
  }): Promise<void> {
    try {
      if (!params.requesterEmail || this.isPlaceholderEmail(params.requesterEmail)) {
        this.logger.warn(`Appointment request confirmation email skipped: requester has no usable email (appId-${params.appId})`);
        return;
      }
      if (!this.emailService) {
        this.logger.warn(`Appointment request confirmation email skipped: email service is unavailable (appId-${params.appId})`);
        return;
      }

      const emailTemplate = buildAppointmentRequestedEmail({
        appId: params.appId,
        requesterName: params.requesterName,
        patientName: params.patientName ?? params.requesterName,
        appType: params.appType,
        portalUrl: 'https://fundacionhuellitas.vercel.app/iniciar-sesion',
      });
      await this.emailService.enqueueEmail({
        to: params.requesterEmail.trim().toLowerCase(),
        subject: emailTemplate.subject,
        text: emailTemplate.text,
        html: emailTemplate.html,
      });
    } catch (error) {
      this.logger.warn(`Appointment request confirmation email could not be prepared (appId-${params.appId}, code-${this.notificationErrorCode(error)})`);
    }
  }

  /**
   * Sends a confirmation notification for a new appointment.
   * @param appointment The appointment for which to send confirmation.
   */
  private async sendConfirmationNotification(
    appointment: AppointmentRow,
  ): Promise<void> {
    try {
      await this.deliverConfirmationNotification(appointment);
    } catch (error) {
      this.logger.warn(`Appointment confirmation email could not be prepared (appId-${appointment.appId}, code-${this.notificationErrorCode(error)})`);
    }
  }

  /**
   * Delivers a confirmation notification for a new appointment.
   * @param appointment The appointment for which to deliver confirmation.
   */
  private async deliverConfirmationNotification(
    appointment: AppointmentRow,
  ): Promise<void> {
    const date = this.formatAppointmentDate(appointment.appDate);
    const patientTemplate = buildAppointmentConfirmedPatientEmail({
      appId: appointment.appId,
      requesterName: appointment.requesterName,
      patientName: appointment.patientName,
      appDate: date,
      appType: appointment.appType,
      psychologistName: appointment.psychologistName,
      portalUrl: 'https://fundacionhuellitas.vercel.app/iniciar-sesion',
    });

    if (appointment.requesterEmail && !this.isPlaceholderEmail(appointment.requesterEmail)) {
      await this.emailService?.enqueueEmail({
        to: appointment.requesterEmail,
        subject: patientTemplate.subject,
        text: patientTemplate.text,
        html: patientTemplate.html,
      });
    } else {
      this.logger.warn(`Appointment confirmation email skipped: requester has no usable email (appId-${appointment.appId})`);
    }

    if (appointment.psychologistId && this.emailService) {
      const psychologistEmail = await this.repo.findPsychologistEmail(appointment.psychologistId);
      if (psychologistEmail && !this.isPlaceholderEmail(psychologistEmail)) {
        const psychologistTemplate = buildAppointmentAssignedPsychologistEmail({
          appId: appointment.appId,
          psychologistName: appointment.psychologistName ?? 'profesional',
          patientName: appointment.patientName,
          appDate: date,
          appType: appointment.appType,
          agendaUrl: 'https://fundacionhuellitas.vercel.app/iniciar-sesion',
        });
        await this.emailService?.enqueueEmail({
          to: psychologistEmail,
          subject: psychologistTemplate.subject,
          text: psychologistTemplate.text,
          html: psychologistTemplate.html,
        });
      } else {
        this.logger.warn(`Appointment confirmation email skipped: psychologist has no usable email (appId-${appointment.appId})`);
      }
    }

    if (appointment.appDate && this.calendarService) {
      try {
        let psychologistEmail: string | null = null;
        if (appointment.psychologistId) {
          psychologistEmail = await this.repo.findPsychologistEmail(appointment.psychologistId);
        }
        const calendarEventId = await this.calendarService.createAppointmentEvent({
          appId: appointment.appId,
          patientName: appointment.patientName,
          requesterEmail: appointment.requesterEmail,
          psychologistName: appointment.psychologistName,
          psychologistEmail,
          appDate: appointment.appDate,
          appDuration: appointment.appDuration,
          appType: appointment.appType,
        });

        if (calendarEventId) {
          await this.repo.saveCalendarEventId(appointment.appId, calendarEventId);
        }
      } catch (error) {
        this.logger.warn(
          `Google Calendar event could not be prepared (appId-${appointment.appId}, code-${this.notificationErrorCode(error)})`,
        );
      }
    }
  }

  /**
   * Sends a cancellation notification for an appointment.
   * @param appointment The appointment for which to send cancellation notification.
   */
  private async sendCancellationNotification(appointment: AppointmentRow): Promise<void> {
    try {
      await this.deliverCancellationNotification(appointment);
    } catch (error) {
      this.logger.warn(`Appointment cancellation email could not be prepared (appId-${appointment.appId}, code-${this.notificationErrorCode(error)})`);
    }
  }

  /**
   * Delivers a cancellation notification for an appointment.
   * @param appointment The appointment for which to deliver cancellation notification.
   */
  private async deliverCancellationNotification(appointment: AppointmentRow): Promise<void> {
    const date = this.formatAppointmentDate(appointment.appDate);
    if (appointment.requesterEmail && !this.isPlaceholderEmail(appointment.requesterEmail)) {
      const patientCancelTemplate = buildAppointmentCancelledEmail({
        appId: appointment.appId,
        recipientName: appointment.requesterName,
        patientName: appointment.patientName,
        appDate: date,
        recipientType: 'patient',
        actionUrl: 'https://fundacionhuellitas.vercel.app/iniciar-sesion',
      });
      await this.emailService?.enqueueEmail({
        to: appointment.requesterEmail,
        subject: patientCancelTemplate.subject,
        text: patientCancelTemplate.text,
        html: patientCancelTemplate.html,
      });
    }

    if (appointment.psychologistId && this.emailService) {
      const psychologistEmail = await this.repo.findPsychologistEmail(appointment.psychologistId);
      if (psychologistEmail && !this.isPlaceholderEmail(psychologistEmail)) {
        const psychologistCancelTemplate = buildAppointmentCancelledEmail({
          appId: appointment.appId,
          recipientName: appointment.psychologistName ?? 'profesional',
          patientName: appointment.patientName,
          appDate: date,
          recipientType: 'psychologist',
          actionUrl: 'https://fundacionhuellitas.vercel.app/iniciar-sesion',
        });
        await this.emailService?.enqueueEmail({
          to: psychologistEmail,
          subject: psychologistCancelTemplate.subject,
          text: psychologistCancelTemplate.text,
          html: psychologistCancelTemplate.html,
        });
      }
    }

    if (appointment.calendarEventId && this.calendarService) {
      try {
        await this.calendarService.deleteAppointmentEvent(appointment.calendarEventId);
        await this.repo.clearCalendarEventId(appointment.appId);
      } catch (error) {
        this.logger.warn(
          `Google Calendar cancellation could not be processed (appId-${appointment.appId}, code-${this.notificationErrorCode(error)})`,
        );
      }
    }
  }

  /**
   * Formats the date of an appointment for display.
   * @param value The date value to format.
   * @returns The formatted date string.
   */
  private formatAppointmentDate(value: string | null): string {
    if (!value) return 'Fecha por confirmar';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'America/Bogota',
    }).format(date);
  }

  /**
   * Checks whether an email is a placeholder email.
   * @param email The email to check.
   * @returns A boolean indicating whether the email is a placeholder.
   */
  private isPlaceholderEmail(email: string): boolean {
    return /^doc_\d+@sana\.org$/i.test(email.trim());
  }

  /**
   * Extracts the error code from a notification error.
   * @param error The error from which to extract the code.
   * @returns The extracted error code.
   */
  private notificationErrorCode(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const code = (error as { code?: unknown }).code;
      if (typeof code === 'string' && /^[A-Za-z0-9_-]+$/.test(code)) return code.slice(0, 80);
    }
    return 'NOTIFICATION_ERROR';
  }
}

/**
 * Checks if an error is a unique constraint violation for the requester.
 * @param error The error to check.
 * @returns A boolean indicating whether the error is a unique constraint violation.
 */
function isRequesterUniqueConstraintViolation(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) return false;
  const driverError = error.driverError as {
    code?: string;
    constraint?: string;
  } | undefined;
  return driverError?.code === '23505'
    && REQUESTER_UNIQUE_CONSTRAINTS.has(driverError.constraint ?? '');
}

/**
 * Checks if an error is a unique constraint violation for a dependent's identity document.
 * @param error The error to check.
 * @returns A boolean indicating whether the error is a dependent unique constraint violation.
 */
function isDependentUniqueConstraintViolation(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) return false;
  const driverError = error.driverError as {
    code?: string;
    constraint?: string;
  } | undefined;
  return driverError?.code === '23505'
    && DEPENDENT_UNIQUE_CONSTRAINTS.has(driverError.constraint ?? '');
}

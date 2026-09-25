import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import type { ConfirmAppointmentDto } from './dto/confirm-appointment.dto.js';
import type { AssignAppointmentDto } from './dto/assign-appointment.dto.js';
import type { DiscardAppointmentDto } from './dto/discard-appointment.dto.js';
import type { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto.js';
import {
  AppointmentsRepository,
  type AppointmentRow,
  type PsychologistOptionRow,
  type RelationshipRow,
} from './appointments.repository.js';
import { ScheduleService } from '../schedule/schedule.service.js';

/**
 * Calculates the age of a person based on their birthdate.
 * @param birthdate The birthdate of the person.
 * @param today The date to calculate the age against (default is current date).
 * @returns The age of the person.
 */
function calculateAge(birthdate: string, today = new Date()): number {
  const date = new Date(`${birthdate}T00:00:00Z`);
  let age = today.getUTCFullYear() - date.getUTCFullYear();
  const hasHadBirthday =
    today.getUTCMonth() > date.getUTCMonth() ||
    (today.getUTCMonth() === date.getUTCMonth() &&
      today.getUTCDate() >= date.getUTCDate());

  if (!hasHadBirthday) age -= 1;
  return age;
}

/**
 * Service for managing appointments
 */
@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly repo: AppointmentsRepository,
    private readonly scheduleService: ScheduleService,
  ) { }

  /**
   * Requests a new appointment.
   * @param dto The data for creating the appointment.
   * @returns A promise resolving to the created appointment ID and a success message.
   */
  async requestAppointment(
    dto: CreateAppointmentDto,
  ): Promise<{ appId: number; message: string }> {
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

    if (dto.patientType === 'dependent') {
      if (!dto.dependentName || !dto.dependentIdentityDocument || !dto.dependentBirthdate) {
        throw new BadRequestException({
          error: 'DEPENDENT_DATA_REQUIRED',
          message: 'Se requieren nombre, documento de identidad y fecha de nacimiento del menor',
        });
      }

      if (!dto.relationshipId) {
        throw new BadRequestException({
          error: 'DEPENDENT_RELATIONSHIP_REQUIRED',
          message: 'Debe indicar el parentesco entre el consultante y el dependiente',
        });
      }

      if (calculateAge(dto.dependentBirthdate) >= 18) {
        throw new BadRequestException({
          error: 'DEPENDENT_MUST_BE_MINOR',
          message: 'El dependiente debe ser menor de edad',
        });
      }

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

    const appId = await this.repo.createRequest({
      requester: {
        name: dto.requesterName.trim(),
        cardType: dto.requesterCardType,
        identityDocument: Number(dto.requesterIdentityDocument),
        contactNumber: dto.requesterContactNumber.trim(),
        email: dto.requesterEmail?.trim(),
        birthdate: dto.requesterBirthdate,
        gender: dto.requesterGender,
        termsAccepted: dto.requesterTermsAccepted,
      },
      dependent: dto.patientType === 'dependent'
        ? {
            name: dto.dependentName!,
            identityDocument: Number(dto.dependentIdentityDocument),
            birthdate: dto.dependentBirthdate!,
            gender: dto.dependentGender,
            contactNumber: dto.dependentContactNumber?.trim() || dto.requesterContactNumber.trim(),
            termsAccepted: dto.dependentTermsAccepted!,
            relationshipId: dto.relationshipId!,
          }
        : null,
      appType: dto.appType,
      appReason: dto.appReason?.trim() ?? null,
      appDateIdeal: dto.appDateIdeal ?? null,
    });

    this.logger.log(
      `Module:appointments, Function:requestAppointment, result-success: appId-${appId}, requesterDoc-${dto.requesterIdentityDocument}, patientType-${dto.patientType}, type-${dto.appType}`,
    );

    return {
      appId,
      message: 'Solicitud de cita registrada con éxito. Un secretario revisará la solicitud y te contactará para confirmar la fecha.',
    };
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

    if (appointment.appState !== 'asignada') {
      throw new BadRequestException({
        error: 'APPOINTMENT_NOT_ASSIGNED',
        message: 'Solo se pueden confirmar citas que ya fueron asignadas a un psicólogo',
      });
    }

    if (appointment.psychologistId !== dto.psyId) {
      throw new BadRequestException({
        error: 'PSYCHOLOGIST_ASSIGNMENT_MISMATCH',
        message: 'La cita debe confirmarse con el psicólogo actualmente asignado',
      });
    }

    if (
      !appointment.appDate ||
      new Date(appointment.appDate).getTime() !== new Date(dto.appDate).getTime() ||
      appointment.appDuration !== dto.appDuration
    ) {
      throw new BadRequestException({
        error: 'APPOINTMENT_SLOT_MISMATCH',
        message: 'La franja confirmada debe coincidir con la franja asignada previamente',
      });
    }

    if (!dto.appDuration) {
      throw new BadRequestException({
        error: 'APPOINTMENT_DURATION_REQUIRED',
        message: 'La duración es obligatoria para ocupar la franja del psicólogo',
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
    if (appointment.appState !== 'pendiente' && appointment.appState !== 'asignada') {
      throw new BadRequestException({
        error: 'APPOINTMENT_NOT_ASSIGNABLE',
        message: 'Solo se pueden asignar solicitudes pendientes o reasignar solicitudes ya asignadas',
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

    const assignment = await this.scheduleService.assignAppointmentSlot({
        appId,
        secretaryUserId,
        psychologistId: dto.psyId,
        appDate: new Date(dto.appDate),
        duration: dto.appDuration,
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

    return this.findByIdOrFail(appId);
  }

  /**
   * Discards an appointment request.
   * @param appId The ID of the appointment to discard.
   * @param dto The DTO containing the discard details.
   * @returns A promise resolving to the discarded appointment.
   */
  async discardAppointment(
    appId: number,
    dto: DiscardAppointmentDto,
  ): Promise<AppointmentRow> {
    await this.findByIdOrFail(appId);
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
   * Updates an appointment's status (cancelada / realizada).
   */
  async updateStatus(
    appId: number,
    dto: UpdateAppointmentStatusDto,
  ): Promise<AppointmentRow> {
    const appointment = await this.findByIdOrFail(appId);

    if (
      appointment.appState === 'cancelada' ||
      appointment.appState === 'realizada' ||
      appointment.appState === 'descartada'
    ) {
      throw new BadRequestException({
        error: 'APPOINTMENT_ALREADY_CLOSED',
        message: `La cita ya se encuentra en estado '${appointment.appState}' y no puede modificarse`,
      });
    }

    await this.repo.updateState(appId, dto.state);
    const updated = await this.findByIdOrFail(appId);
    this.logger.log(
      `Module:appointments, Function:updateStatus, result-success: appId-${appId}, newState-${dto.state}`,
    );
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
   * Gets details of a single appointment.
   * @param appId The ID of the appointment to find.
   * @returns A promise resolving to the appointment details.
   */
  async findById(appId: number): Promise<AppointmentRow> {
    return this.findByIdOrFail(appId);
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
   * Helper to send confirmation notification.
   * @param appointment Appointment to send confirmation notification.
   */
  private async sendConfirmationNotification(
    appointment: AppointmentRow,
  ): Promise<void> {
    this.logger.log(
      `[NOTIFICACIÓN] Espacio para envío automático de confirmación para la cita ID: ${appointment.appId}`,
    );
    this.logger.log(
      `[NOTIFICACIÓN] Destinatario: ${appointment.requesterName}, Teléfono: ${appointment.requesterContactNumber}, Correo: ${appointment.requesterEmail}`,
    );
    this.logger.log(
      `[NOTIFICACIÓN] Fecha confirmada: ${appointment.appDate}, Psicólogo: ${appointment.psychologistName}, Modalidad: ${appointment.appType}`,
    );

    //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    // ESPACIO PARA INTEGRACIÓN CON SERVICIOS EXTERNOS
    //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

    // TODO: Integración WhatsApp Business API
    // const whatsappPayload = {
    //   to: appointment.requesterContactNumber,
    //   template: 'appointment_confirmed',
    //   parameters: [appointment.requesterName, appointment.appDate, appointment.psychologistName],
    // };
    // await this.whatsappService.send(whatsappPayload);

    // TODO: Integración Servicio de Correo Electrónico
    // const emailPayload = {
    //   to: appointment.requesterEmail,
    //   subject: 'Confirmación de tu cita psicológica - Fundación Dejando Huellas Felices',
    //   template: 'appointment-confirmation',
    //   context: { appointment },
    // };
    // await this.emailService.send(emailPayload);
  }
}

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import type { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import type { ConfirmAppointmentDto } from './dto/confirm-appointment.dto.js';
import type { AssignAppointmentDto } from './dto/assign-appointment.dto.js';
import type { DiscardAppointmentDto } from './dto/discard-appointment.dto.js';
import type { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto.js';
import {
  AppointmentsRepository,
  type AppointmentRow,
  type PsychologistHistoryRow,
  type PsychologistOptionRow,
  type RequesterAppointmentRow,
  type RelationshipRow,
} from './appointments.repository.js';
import { ScheduleService } from '../schedule/schedule.service.js';
import { EmailService } from '../email/email.service.js';

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
    @Optional() private readonly emailService?: EmailService,
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
        identityDocument: dto.requesterIdentityDocument,
        contactNumber: dto.requesterContactNumber.trim(),
        email: dto.requesterEmail?.trim(),
        birthdate: dto.requesterBirthdate,
        gender: dto.requesterGender,
        termsAccepted: dto.requesterTermsAccepted,
        residenceZone: dto.residenceZone?.trim() ?? null,
      },
      dependent: dto.patientType === 'dependent'
        ? {
          name: dto.dependentName!,
          identityDocument: dto.dependentIdentityDocument!,
          birthdate: dto.dependentBirthdate!,
          gender: dto.dependentGender,
          termsAccepted: dto.dependentTermsAccepted!,
          relationshipId: dto.relationshipId!,
        }
        : null,
      appType: dto.appType,
      appReason: dto.appReason?.trim() ?? null,
    });

    this.logger.log(
      `Module:appointments, Function:requestAppointment, result-success: appId-${appId}, requesterDoc-${dto.requesterIdentityDocument}, patientType-${dto.patientType}, type-${dto.appType}`,
    );
    await this.notifySecretaryOfNewRequest(dto, appId);

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
    if (appointment.appState !== 'pendiente' && appointment.appState !== 'asignada') {
      throw new BadRequestException({
        error: 'APPOINTMENT_NOT_ASSIGNABLE',
        message: 'Solo se pueden asignar solicitudes pendientes o reasignar solicitudes ya asignadas',
      });
    }

    // Validar que el secretario no gestione su propia cita
    if (appointment.requesterId === secretaryUserId) {
      throw new BadRequestException({
        error: 'SECRETARY_CANNOT_MANAGE_OWN_APPOINTMENT',
        message: 'Un secretario no puede gestionar su propia cita. Solicite que otro secretario gestione esta solicitud.',
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
  ): Promise<AppointmentRow> {
    const appointment = await this.findByIdOrFail(appId);

    // Validar que el secretario no gestione su propia cita
    if (appointment.requesterId === secretaryUserId) {
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
   * Updates an appointment's status (cancelada / realizada).
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

    if (dto.state !== 'cancelada') {
      throw new BadRequestException({
        error: 'INVALID_APPOINTMENT_STATUS_TRANSITION',
        message: 'El secretario solo puede cancelar citas confirmadas',
      });
    }

    if (appointment.appState !== 'confirmada') {
      if (['cancelada', 'realizada', 'descartada'].includes(appointment.appState)) {
        throw new BadRequestException({
          error: 'APPOINTMENT_ALREADY_CLOSED',
          message: `La cita ya se encuentra en estado '${appointment.appState}' y no puede modificarse`,
        });
      }
      throw new BadRequestException({
        error: 'APPOINTMENT_NOT_CONFIRMED',
        message: 'Solo se pueden cancelar citas que ya fueron confirmadas',
      });
    }

    const transitioned = await this.repo.updateState(appId, 'cancelada');
    if (!transitioned) {
      throw new ConflictException({
        error: 'APPOINTMENT_STATE_CHANGED',
        message: 'La cita cambió de estado y ya no puede cancelarse',
      });
    }
    const updated = await this.findByIdOrFail(appId);
    this.logger.log(
      `Module:appointments, Function:updateStatus, result-success: appId-${appId}, newState-${dto.state}`,
    );
    await this.sendCancellationNotification(updated);
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
    return this.repo.findByRequester(requesterId);
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
   * @param psychologistUserId The ID of the psychologist marking it as completed.
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

    this.logger.log(
      `Module:appointments, Function:markAsCompleted, result-success: appId-${appId}, psychologistId-${psychologistId}`,
    );

    return updated;
  }

  /**
   * Notifies the secretary of a new appointment request.
   * @param dto The DTO containing the appointment request details.
   * @param appId The ID of the appointment.
   * @returns A promise resolving when the notification is sent.
   */
  private async notifySecretaryOfNewRequest(
    dto: CreateAppointmentDto,
    appId: number,
  ): Promise<void> {
    try {
      const recipients = (await this.repo.findActiveSecretaryEmails())
        .filter((email) => email && !this.isPlaceholderEmail(email));
      if (!recipients.length) {
        this.logger.warn(`Appointment request email skipped: no active secretary email is available (appId-${appId})`);
        return;
      }
      const emailService = this.emailService;
      if (!emailService) {
        this.logger.warn(`Appointment request email skipped: email service is unavailable (appId-${appId})`);
        return;
      }

      const patientName = dto.patientType === 'dependent' ? dto.dependentName : dto.requesterName;
      await Promise.all(recipients.map((recipient) =>
        emailService.enqueueEmail({
          to: recipient,
          subject: `Nueva solicitud de cita #${appId}`,
          text: [
            'Se recibió una nueva solicitud de cita.',
            `Radicado: ${appId}`,
            `Solicitante: ${dto.requesterName}`,
            `Paciente: ${patientName}`,
            `Modalidad: ${dto.appType}`,
          ].join('\n'),
        }),
      ));
    } catch (error) {
      this.logger.warn(`Appointment request email recipients could not be resolved (appId-${appId}, code-${this.notificationErrorCode(error)})`);
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
    const patientMessage = [
      `Hola ${appointment.requesterName},`,
      `La cita para ${appointment.patientName} quedó confirmada.`,
      `Fecha y hora: ${date}`,
      `Modalidad: ${appointment.appType}`,
      `Profesional: ${appointment.psychologistName ?? 'Por confirmar'}`,
      'Este mensaje no incluye información clínica.',
    ].join('\n');

    if (appointment.requesterEmail && !this.isPlaceholderEmail(appointment.requesterEmail)) {
      await this.emailService?.enqueueEmail({
        to: appointment.requesterEmail,
        subject: 'Confirmación de tu cita psicológica - Fundación Dejando Huellas Felices',
        text: patientMessage,
      });
    } else {
      this.logger.warn(`Appointment confirmation email skipped: requester has no usable email (appId-${appointment.appId})`);
    }

    if (appointment.psychologistId && this.emailService) {
      const psychologistEmail = await this.repo.findPsychologistEmail(appointment.psychologistId);
      if (psychologistEmail && !this.isPlaceholderEmail(psychologistEmail)) {
        await this.emailService?.enqueueEmail({
          to: psychologistEmail,
          subject: `Nueva cita asignada #${appointment.appId}`,
          text: [
            `Hola ${appointment.psychologistName ?? 'profesional'},`,
            `Tienes una cita confirmada con ${appointment.patientName}.`,
            `Fecha y hora: ${date}`,
            `Modalidad: ${appointment.appType}`,
          ].join('\n'),
        });
      } else {
        this.logger.warn(`Appointment confirmation email skipped: psychologist has no usable email (appId-${appointment.appId})`);
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
      await this.emailService?.enqueueEmail({
        to: appointment.requesterEmail,
        subject: `Cita cancelada #${appointment.appId}`,
        text: `La cita para ${appointment.patientName} del ${date} fue cancelada. Para coordinar una nueva fecha, comunícate con la fundación.`,
      });
    }

    if (appointment.psychologistId && this.emailService) {
      const psychologistEmail = await this.repo.findPsychologistEmail(appointment.psychologistId);
      if (psychologistEmail && !this.isPlaceholderEmail(psychologistEmail)) {
        await this.emailService?.enqueueEmail({
          to: psychologistEmail,
          subject: `Cita cancelada #${appointment.appId}`,
          text: `La cita con ${appointment.patientName} del ${date} fue cancelada.`,
        });
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

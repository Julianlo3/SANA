import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { RegisterAttentionDto } from './dto/register-attention.dto.js';
import type { ClinicalNoteResponseDto, ClinicalNoteAuditResponseDto } from './dto/clinical-note-response.dto.js';
import type { ConsultantAttentionHistoryDto } from './dto/clinical-note-history.dto.js';
import { ClinicalNotesRepository } from './clinical-notes.repository.js';
import { AppointmentsRepository } from '../appointments/appointments.repository.js';

/**
 * Service for managing clinical notes with access control
 */
@Injectable()
export class ClinicalNotesService {
  private readonly logger = new Logger(ClinicalNotesService.name);

  constructor(
    private readonly clinicalNotesRepo: ClinicalNotesRepository,
    private readonly appointmentsRepo: AppointmentsRepository,
  ) { }

  /**
   * Registers attention with optional observation for a completed appointment
   * @param dto The registration data
   * @param psychologistId The psychologist ID
   * @param request The HTTP request for IP address
   * @returns The created clinical note
   */
  async registerAttention(
    dto: RegisterAttentionDto,
    psychologistId: number,
    request: Request,
  ): Promise<ClinicalNoteResponseDto> {
    // Valida que el psicólogo acepte los términos y condiciones
    if (!dto.termsAccepted) {
      throw new BadRequestException({
        error: 'TERMS_NOT_ACCEPTED',
        message: 'Debe aceptar los términos y condiciones de la nota clínica',
      });
    }

    // Valida que la cita exista y esté en estado 'realizada'
    const appointment = await this.clinicalNotesRepo.getAppointmentDetails(dto.appId);
    if (!appointment) {
      throw new NotFoundException({
        error: 'APPOINTMENT_NOT_FOUND',
        message: 'La cita no existe',
      });
    }

    // Valida que la cita esté en estado 'realizada'
    if (appointment.appState !== 'realizada') {
      throw new BadRequestException({
        error: 'APPOINTMENT_NOT_COMPLETED',
        message: 'Solo se pueden registrar notas clínicas en citas efectivamente realizadas',
      });
    }

    // Valida que el psicólogo sea el tratante
    if (appointment.psyId !== psychologistId) {
      throw new ForbiddenException({
        error: 'NOT_TREATING_PSYCHOLOGIST',
        message: 'Solo el psicólogo tratante puede registrar notas clínicas para esta cita',
      });
    }

    // La observación es opcional
    const observation = dto.observation || '';

    // Crea la nota clínica
    const cnId = await this.clinicalNotesRepo.create({
      appId: dto.appId,
      psyId: psychologistId,
      cnObservation: observation,
      cnTermsAccepted: dto.termsAccepted,
    });

    // Registra la auditoría de la operación
    const ipAddress = this.extractIpAddress(request);
    await this.clinicalNotesRepo.recordAudit({
      cnId,
      psyId: psychologistId,
      ipAddress,
    });

    this.logger.log(
      `Module:clinical-notes, Function:registerAttention, result-success: cnId-${cnId}, appId-${dto.appId}, psychologistId-${psychologistId}`,
    );

    return {
      cnId,
      appId: dto.appId,
      psyId: psychologistId,
      cnObservation: observation,
      cnTermsAccepted: dto.termsAccepted,
      cnCreatedAt: new Date(),
    };
  }

  /**
   * Gets a clinical note by ID with access control
   * @param cnId The clinical note ID
   * @param psychologistId The requesting psychologist ID
   * @returns The clinical note
   */
  async findById(cnId: number, psychologistId: number): Promise<ClinicalNoteResponseDto> {
    const note = await this.clinicalNotesRepo.findById(cnId, psychologistId);
    if (!note) {
      throw new ForbiddenException({
        error: 'ACCESS_DENIED',
        message: 'No tiene permisos para acceder a esta nota clínica',
      });
    }
    return note;
  }

  /**
   * Gets clinical notes for a specific appointment with access control
   * @param appId The appointment ID
   * @param psychologistId The requesting psychologist ID
   * @returns Array of clinical notes
   */
  async findByAppointment(
    appId: number,
    psychologistId: number,
  ): Promise<ClinicalNoteResponseDto[]> {
    // Valida que el psicólogo sea el tratante
    const isTreating = await this.clinicalNotesRepo.isTreatingPsychologist(appId, psychologistId);
    if (!isTreating) {
      throw new ForbiddenException({
        error: 'NOT_TREATING_PSYCHOLOGIST',
        message: 'Solo el psicólogo tratante puede acceder a las notas de esta cita',
      });
    }

    return this.clinicalNotesRepo.findByAppointment(appId, psychologistId);
  }

  /**
   * Gets clinical notes history for a consultant with access control
   * @param requesterId The consultant (requester) ID
   * @param psychologistId The requesting psychologist ID
   * @returns The consultant's attention history
   */
  async findConsultantHistory(
    requesterId: number,
    psychologistId: number,
  ): Promise<ConsultantAttentionHistoryDto> {
    const notes = await this.clinicalNotesRepo.findConsultantHistory(requesterId, psychologistId);

    // Obtiene el nombre del consultante de la cita
    const appointment = await this.appointmentsRepo.findById(notes[0]?.appId || 0);
    const requesterName = appointment?.requesterName || 'Consultante';

    return {
      requesterId,
      requesterName,
      notes: notes.map((note) => ({
        cnId: note.cnId,
        appId: note.appId,
        appDate: note.appDate,
        psychologistName: note.psychologistName,
        cnObservation: note.cnObservation,
        cnCreatedAt: note.cnCreatedAt,
      })),
    };
  }

  /**
   * Gets audit history for a clinical note with access control
   * @param cnId The clinical note ID
   * @param psychologistId The requesting psychologist ID
   * @returns Array of audit entries
   */
  async findAuditHistory(
    cnId: number,
    psychologistId: number,
  ): Promise<ClinicalNoteAuditResponseDto[]> {
    // Valida que el psicólogo tenga acceso a la nota
    const note = await this.clinicalNotesRepo.findById(cnId, psychologistId);
    if (!note) {
      throw new ForbiddenException({
        error: 'ACCESS_DENIED',
        message: 'No tiene permisos para acceder al historial de auditoría de esta nota',
      });
    }

    return this.clinicalNotesRepo.findAuditHistory(cnId, psychologistId);
  }

  /**
   * Extracts IP address from request
   * @param request The HTTP request
   * @returns The IP address
   */
  private extractIpAddress(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      (request.headers['x-real-ip'] as string) ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }
}

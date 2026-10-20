import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Person, PersonState } from '../users/entities/person.entity.js';
import { PersonRol } from '../users/entities/person-rol.entity.js';
import { Rol } from '../users/entities/rol.entity.js';
import { Appointment } from '../users/entities/appointment.entity.js';
import { Psychologist } from '../users/entities/psychologist.entity.js';
import type { CreateConsultantDto } from './dto/create-consultant.dto.js';
import type { UpdateConsultantDto } from './dto/update-consultant.dto.js';
import type {
  ConsultantResponse,
  PsychologistConsultantRecordResponse,
  PsychologistConsultantSummaryResponse,
} from './dto/consultant-response.dto.js';

const STATE_TO_STATUS: Record<PersonState, ConsultantResponse['status']> = {
  activo: 'active',
  inactivo: 'inactive',
  bloqueado: 'blocked',
  pendiente: 'pending',
};

/**
 * Service for managing consultant records.
 */
@Injectable()
export class ConsultantsService {
  private readonly logger = new Logger(ConsultantsService.name);

  constructor(
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    @InjectRepository(PersonRol)
    private readonly personRolRepository: Repository<PersonRol>,
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Psychologist)
    private readonly psychologistRepository: Repository<Psychologist>,
    private readonly dataSource: DataSource,
  ) { }

  /**
   * Creates a new consultant record.
   * @param dto The data for the new consultant record.
   * @param createdByUserId The id of the user who created the consultant record.
   * @returns The newly created consultant record.
   */
  async create(
    dto: CreateConsultantDto,
    createdByUserId: number,
  ): Promise<ConsultantResponse> {
    // Validar que no exista el consultante por documento de identidad
    const existingByDocument = await this.personRepository.findOne({
      where: { perIdentityDocument: dto.identityDocument },
    });

    if (existingByDocument) {
      throw new ConflictException({
        error: 'CONSULTANT_ALREADY_EXISTS',
        message: 'Ya existe una ficha registrada con el documento de identidad proporcionado',
        details: {
          consultantId: existingByDocument.perId,
          fullName: existingByDocument.perName,
        },
      });
    }

    return this.dataSource.transaction(async (manager) => {
      const created = await manager.save(
        manager.create(Person, {
          perName: dto.fullName,
          perCardType: dto.cardType,
          perIdentityDocument: dto.identityDocument,
          perEmail: dto.email.trim().toLowerCase(),
          perContactNumber: dto.phone,
          perBirthdate: dto.birthdate,
          perGender: dto.gender,
          perResidenceZone: dto.residenceZone?.trim() ?? null,
          perState: 'activo',
          perCreatedBy: createdByUserId,
          perCreatedAt: new Date(),
        }),
      );

      // Asignar rol de consultante (rol_id = 3)
      await manager.save(
        manager.create(PersonRol, {
          perId: created.perId,
          rolId: 3, // Rol consultante
          active: true,
          assignedAt: new Date(),
        }),
      );

      // Registra la aceptación de la política de tratamiento de datos
      if (dto.termsAccepted) {
        const pdId = await manager.query<{ pd_id: number }[]>(
          `SELECT pd_id
           FROM policy_documents
           WHERE pd_type = 'data_treatment'
           ORDER BY pd_effective_from DESC
           LIMIT 1`,
        );
        if (pdId[0]?.pd_id) {
          await manager.query(
            `INSERT INTO policy_acceptance (per_id, pd_id)
             VALUES ($1, $2)
             ON CONFLICT (per_id, pd_id) WHERE dep_id IS NULL AND cn_id IS NULL AND app_id IS NULL DO NOTHING`,
            [created.perId, pdId[0].pd_id],
          );
        }
      }

      this.logger.log(
        `Module:consultants, Function:create, result-success: personId-${created.perId}, identityDocument-${dto.identityDocument}, createdBy-${createdByUserId}`,
      );

      return this.toResponse(manager, created.perId);
    });
  }

  /**
   * Finds a consultant record by id.
   * @param id The id of the consultant record to find.
   * @returns The consultant record with the specified id.
   */
  async findOne(id: number): Promise<ConsultantResponse> {
    const person = await this.personRepository.findOne({
      where: { perId: id },
    });

    if (!person) {
      throw new NotFoundException(`No existe una ficha de consultante con ID ${id}`);
    }

    // Verificar que tenga rol de consultante
    const hasConsultantRole = await this.personRolRepository.exists({
      where: { perId: id, rolId: 3 },
    });

    if (!hasConsultantRole) {
      throw new BadRequestException({
        error: 'NOT_A_CONSULTANT',
        message: 'La persona indicada no tiene el rol de consultante',
      });
    }

    return this.toResponse(this.dataSource.manager, id);
  }

  /**
   * Finds all consultants.
   * @returns A list of consultants.
   */
  async findAll(): Promise<ConsultantResponse[]> {
    const consultants = await this.personRepository
      .createQueryBuilder('person')
      .innerJoin('person.personRols', 'pr', 'pr.rolId = :roleId AND pr.active = true', { roleId: 3 })
      .orderBy('person.perName', 'ASC')
      .getMany();

    return Promise.all(
      consultants.map((person) =>
        this.toResponse(this.dataSource.manager, person.perId, person),
      ),
    );
  }

  /**
   * Finds consultants with appointments assigned to the authenticated psychologist.
   * @param psychologistId The id of the authenticated psychologist.
   * @returns A list of consultants with appointments assigned to the authenticated psychologist.
   */
  findMineForPsychologist(
    psychologistId: number,
  ): Promise<PsychologistConsultantSummaryResponse[]> {
    return this.dataSource.query<PsychologistConsultantSummaryResponse[]>(
      `SELECT
          req.per_id AS "id",
          req.per_name AS "fullName",
          req.per_identity_document::text AS "identityDocument",
          req.per_email AS "email",
          COALESCE(req.per_contact_number::text, '') AS "phone",
          NULL::text AS "residence",
          CASE WHEN req.per_state = 'activo' THEN 'active' ELSE 'inactive' END AS "status",
          $1::integer AS "assignedPsychologistId",
          NULL::text AS "assignedPsychologistName",
          MAX(a.app_date) AS "lastAppointmentAt",
          COUNT(a.app_id)::integer AS "appointmentCount",
          COUNT(*) FILTER (WHERE a.app_state = 'realizada')::integer AS "completedAppointmentCount",
          COUNT(*) FILTER (WHERE a.app_state IN ('asignada', 'confirmada'))::integer AS "waitingAppointmentCount"
       FROM appointments a
       JOIN person req ON req.per_id = a.req_id
       WHERE a.psy_id = $1
         AND a.app_state IN ('asignada', 'confirmada', 'realizada')
       GROUP BY req.per_id, req.per_name, req.per_identity_document,
                req.per_email, req.per_contact_number, req.per_state
       ORDER BY req.per_name`,
      [psychologistId],
    );
  }

  /**
   * Finds a consultant with full details for the authenticated psychologist.
   * @param consultantId The id of the consultant to find.
   * @param psychologistId The id of the authenticated psychologist.
   * @returns The consultant with full details for the authenticated psychologist.
   */
  async findFullForPsychologist(
    consultantId: number,
    psychologistId: number,
  ): Promise<PsychologistConsultantRecordResponse> {
    const consultants = await this.dataSource.query<
      PsychologistConsultantSummaryResponse[]
    >(
      `SELECT
          req.per_id AS "id",
          req.per_name AS "fullName",
          req.per_identity_document::text AS "identityDocument",
          req.per_email AS "email",
          COALESCE(req.per_contact_number::text, '') AS "phone",
          NULL::text AS "residence",
          CASE WHEN req.per_state = 'activo' THEN 'active' ELSE 'inactive' END AS "status",
          $2::integer AS "assignedPsychologistId",
          NULL::text AS "assignedPsychologistName",
          MAX(a.app_date) AS "lastAppointmentAt",
          COUNT(a.app_id)::integer AS "appointmentCount",
          COUNT(*) FILTER (WHERE a.app_state = 'realizada')::integer AS "completedAppointmentCount",
          COUNT(*) FILTER (WHERE a.app_state IN ('asignada', 'confirmada'))::integer AS "waitingAppointmentCount"
       FROM person req
       JOIN appointments a ON a.req_id = req.per_id
       WHERE req.per_id = $1
         AND a.psy_id = $2
         AND a.app_state IN ('asignada', 'confirmada', 'realizada')
       GROUP BY req.per_id, req.per_name, req.per_identity_document,
                req.per_email, req.per_contact_number, req.per_state`,
      [consultantId, psychologistId],
    );

    const consultant = consultants[0];
    if (!consultant) {
      throw new ForbiddenException({
        error: 'CONSULTANT_NOT_ASSIGNED',
        message: 'No tienes acceso a la información de este consultante',
      });
    }

    const rows = await this.dataSource.query<
      {
        appId: number;
        appState: 'asignada' | 'confirmada' | 'realizada';
        appDate: Date | null;
        appDuration: number | null;
        appReason: string | null;
        psychologistName: string;
        cnId: number | null;
        cnObservation: string | null;
        cnCreatedAt: Date | null;
      }[]
    >(
      `SELECT
          a.app_id AS "appId",
          a.app_state AS "appState",
          a.app_date AS "appDate",
          a.app_duration AS "appDuration",
          a.app_reason AS "appReason",
          psy.per_name AS "psychologistName",
          cn.cn_id AS "cnId",
          cn.cn_observation AS "cnObservation",
          cn.cn_created_at AS "cnCreatedAt"
       FROM appointments a
       JOIN person psy ON psy.per_id = a.psy_id
       LEFT JOIN clinical_notes cn
         ON cn.app_id = a.app_id AND cn.psy_id = a.psy_id
       WHERE a.req_id = $1
         AND a.psy_id = $2
         AND a.app_state IN ('asignada', 'confirmada', 'realizada')
       ORDER BY a.app_date DESC NULLS LAST, a.app_id DESC, cn.cn_created_at DESC`,
      [consultantId, psychologistId],
    );

    const appointments = new Map<
      number,
      PsychologistConsultantRecordResponse['appointments'][number]
    >();
    const careRecords: PsychologistConsultantRecordResponse['careRecords'] = [];

    for (const row of rows) {
      let appointment = appointments.get(row.appId);
      if (!appointment) {
        appointment = {
          id: row.appId,
          state: row.appState,
          appDate: row.appDate,
          duration: row.appDuration,
          reason: row.appReason,
          clinicalNotes: [],
        };
        appointments.set(row.appId, appointment);
      }

      if (
        row.cnId !== null &&
        row.cnObservation !== null &&
        row.cnCreatedAt !== null
      ) {
        appointment.clinicalNotes.push({
          id: row.cnId,
          observation: row.cnObservation,
          createdAt: row.cnCreatedAt,
        });
        careRecords.push({
          id: row.cnId,
          appointmentId: row.appId,
          attendedAt: row.appDate,
          observation: row.cnObservation,
          recordedByPsychologistId: psychologistId,
          recordedByPsychologistName: row.psychologistName,
        });
      }
    }

    return {
      ...consultant,
      appointments: [...appointments.values()],
      careRecords,
    };
  }

  /**
   * Updates a consultant record.
   * Allows modification of authorized administrative information only.
   * @param id The id of the consultant record to update.
   * @param dto The data for the consultant record to update.
   * @param updatedByUserId The id of the user who updated the consultant record.
   * @returns The updated consultant record.
   */
  async update(
    id: number,
    dto: UpdateConsultantDto,
    updatedByUserId: number,
  ): Promise<ConsultantResponse> {
    const person = await this.findByIdOrFail(id);

    // Verificar que tenga rol de consultante
    const hasConsultantRole = await this.personRolRepository.exists({
      where: { perId: id, rolId: 3 },
    });

    if (!hasConsultantRole) {
      throw new BadRequestException({
        error: 'NOT_A_CONSULTANT',
        message: 'La persona indicada no tiene el rol de consultante',
      });
    }

    // Validar duplicado por documento si se está cambiando
    if (dto.identityDocument && dto.identityDocument !== person.perIdentityDocument?.toString()) {
      const existingByDocument = await this.personRepository.findOne({
        where: { perIdentityDocument: dto.identityDocument },
      });

      if (existingByDocument) {
        throw new ConflictException({
          error: 'IDENTITY_DOCUMENT_ALREADY_EXISTS',
          message: 'El documento de identidad ya está registrado en otra ficha',
        });
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const personToUpdate = await this.findByIdOrFail(id, manager);

      if (dto.fullName !== undefined) personToUpdate.perName = dto.fullName;
      if (dto.cardType !== undefined) personToUpdate.perCardType = dto.cardType;
      if (dto.identityDocument !== undefined)
        personToUpdate.perIdentityDocument = dto.identityDocument;
      if (dto.email !== undefined) personToUpdate.perEmail = dto.email.trim().toLowerCase();
      if (dto.phone !== undefined) personToUpdate.perContactNumber = dto.phone;
      if (dto.birthdate !== undefined) personToUpdate.perBirthdate = dto.birthdate;
      if (dto.gender !== undefined) personToUpdate.perGender = dto.gender;
      if (dto.residenceZone !== undefined) personToUpdate.perResidenceZone = dto.residenceZone?.trim() ?? null;
      personToUpdate.perUpdateDate = new Date();

      // Registra la aceptación de la política de tratamiento de datos
      if (dto.termsAccepted !== undefined && dto.termsAccepted) {
        const pdId = await manager.query<{ pd_id: number }[]>(
          `SELECT pd_id
           FROM policy_documents
           WHERE pd_type = 'data_treatment'
           ORDER BY pd_effective_from DESC
           LIMIT 1`,
        );
        if (pdId[0]?.pd_id) {
          await manager.query(
            `INSERT INTO policy_acceptance (per_id, pd_id)
             VALUES ($1, $2)
             ON CONFLICT (per_id, pd_id) WHERE dep_id IS NULL AND cn_id IS NULL AND app_id IS NULL DO NOTHING`,
            [id, pdId[0].pd_id],
          );
        }
      }

      await manager.save(personToUpdate);

      this.logger.log(
        `Module:consultants, Function:update, result-success: personId-${id}, updatedBy-${updatedByUserId}`,
      );

      return this.toResponse(manager, id);
    });
  }

  /**
   * Finds a person record by id or throws an error if not found.
   * @param id The id of the person record to find.
   * @param manager The entity manager to use for the query.
   * @returns The person record with the specified id.
   */
  private async findByIdOrFail(
    id: number,
    manager: EntityManager = this.dataSource.manager,
  ): Promise<Person> {
    const person = await manager.findOneBy(Person, { perId: id });
    if (!person) {
      throw new NotFoundException(`No existe una persona con id ${id}`);
    }
    return person;
  }

  /**
   * Converts a person record to a consultant response.
   * @param manager The entity manager to use for the query.
   * @param personId The id of the person record to convert.
   * @param preloaded Optional preloaded person record.
   * @returns The consultant response.
   */
  private async toResponse(
    manager: EntityManager,
    personId: number,
    preloaded?: Person,
  ): Promise<ConsultantResponse> {
    const person = preloaded ?? (await this.findByIdOrFail(personId, manager));

    // Obtener información de citas (historial)
    const appointments = await manager.find(Appointment, {
      where: { requesterPersonId: personId },
      order: { appCreatedAt: 'DESC' },
      take: 1,
    });

    // Obtener psicólogo asignado a la última cita
    let assignedPsychologistName: string | null = null;
    if (appointments.length > 0 && appointments[0].psychologistUserId) {
      const psychologist = await manager.findOne(Psychologist, {
        where: { id: appointments[0].psychologistUserId },
      });
      if (psychologist) {
        const psychologistPerson = await manager.findOneBy(Person, { perId: psychologist.id });
        assignedPsychologistName = psychologistPerson?.perName ?? null;
      }
    }

    //  Verifica si el consultante ha aceptado la política de tratamiento de datos
    const policyAcceptance = await manager.query<{ exists: boolean }[]>(
      `SELECT EXISTS (
         SELECT 1
         FROM policy_acceptance pa
         JOIN policy_documents pd ON pa.pd_id = pd.pd_id
         WHERE pa.per_id = $1
           AND pd.pd_type = 'data_treatment'
           AND pa.dep_id IS NULL
           AND pa.cn_id IS NULL
           AND pa.app_id IS NULL
       ) AS exists`,
      [personId],
    );
    const termsAccepted = policyAcceptance[0]?.exists ?? false;

    return {
      id: person.perId,
      fullName: person.perName,
      cardType: person.perCardType ?? 'CC',
      identityDocument: person.perIdentityDocument?.toString() ?? '',
      email: person.perEmail,
      phone: person.perContactNumber ?? '',
      birthdate: person.perBirthdate ?? '',
      gender: person.perGender ?? 'P',
      termsAccepted,
      residenceZone: person.perResidenceZone,
      status: STATE_TO_STATUS[person.perState],
      createdAt: person.perCreatedAt.toISOString(),
      updatedAt: person.perUpdateDate?.toISOString() ?? null,
      appointmentCount: appointments.length,
      lastAppointmentDate: appointments.length > 0 ? appointments[0].appCreatedAt.toISOString() : null,
      assignedPsychologistName,
    };
  }
}

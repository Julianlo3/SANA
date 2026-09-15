import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, QueryFailedError, Repository } from 'typeorm';
import { AssignedRoleDto } from './dto/assigned-role.dto.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import {
  UpdateUserStatusDto,
  type UserStatus,
} from './dto/update-user-status.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { Appointment } from './entities/appointment.entity.js';
import { Person, PersonState } from './entities/person.entity.js';
import { PersonRol } from './entities/person-rol.entity.js';
import { RequesterDependent } from './entities/requester-dependent.entity.js';
import { Rol } from './entities/rol.entity.js';
import { Schedule } from './entities/schedule.entity.js';
import { UserAccount } from './entities/user-account.entity.js';
import type { UserResponse, UserRoleResponse } from './interfaces/user-response.interface.js';
import { ASSIGNABLE_ROLES } from './users.constants.js';

const FOREIGN_KEY_VIOLATION = '23503';

const STATE_TO_STATUS: Record<PersonState, UserResponse['status']> = {
  activo: 'active',
  inactivo: 'inactive',
  bloqueado: 'blocked',
  pendiente: 'pending',
};

const STATUS_TO_STATE: Record<UserStatus, PersonState> = {
  active: 'activo',
  inactive: 'inactivo',
  blocked: 'bloqueado',
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    @InjectRepository(PersonRol)
    private readonly personRolRepository: Repository<PersonRol>,
    @InjectRepository(Rol)
    private readonly rolRepository: Repository<Rol>,
    @InjectRepository(UserAccount)
    private readonly userAccountRepository: Repository<UserAccount>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(RequesterDependent)
    private readonly requesterDependentRepository: Repository<RequesterDependent>,
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateUserDto): Promise<UserResponse> {
    const email = dto.email.trim().toLowerCase();
    const role = await this.findAssignableRoleOrFail(dto.roleId);

    return this.dataSource.transaction(async (manager) => {
      const existing = await manager
        .createQueryBuilder(Person, 'person')
        .where('lower(person.per_email) = :email', { email })
        .getOne();

      if (existing) {
        const hasClaimedAccount = await manager.exists(UserAccount, {
          where: { useId: existing.perId },
        });
        if (hasClaimedAccount) {
          throw new ConflictException({
            error: 'EMAIL_ALREADY_REGISTERED',
            message: 'El correo ya esta registrado como usuario activo',
            details: { email },
          });
        }

        existing.perName = dto.fullName;
        existing.perIdentityDocument = Number(dto.identityDocument);
        existing.perContactNumber = dto.phone;
        existing.perState = 'activo';
        existing.perUpdateDate = new Date();
        await manager.save(existing);
        await this.replaceRoles(manager, existing.perId, [
          { roleId: role.rolId, active: true },
        ]);
        return this.toResponse(manager, existing.perId);
      }

      const created = await manager.save(
        manager.create(Person, {
          perName: dto.fullName,
          perIdentityDocument: Number(dto.identityDocument),
          perEmail: email,
          perContactNumber: dto.phone,
          perState: 'activo',
        }),
      );
      await this.replaceRoles(manager, created.perId, [
        { roleId: role.rolId, active: true },
      ]);
      return this.toResponse(manager, created.perId);
    });
  }

  async findAll(filters: {
    status?: UserStatus;
    search?: string;
  }): Promise<UserResponse[]> {
    const query = this.personRepository
      .createQueryBuilder('person')
      .where('person.per_state != :pending', { pending: 'pendiente' });

    if (filters.status) {
      query.andWhere('person.per_state = :state', {
        state: STATUS_TO_STATE[filters.status],
      });
    }
    if (filters.search) {
      query.andWhere(
        '(lower(person.per_name) LIKE :search OR lower(person.per_email) LIKE :search)',
        { search: `%${filters.search.trim().toLowerCase()}%` },
      );
    }

    const persons = await query.orderBy('person.per_name', 'ASC').getMany();
    return Promise.all(
      persons.map((person) => this.toResponse(this.dataSource.manager, person.perId, person)),
    );
  }

  async update(id: number, dto: UpdateUserDto): Promise<UserResponse> {
    await this.findByIdOrFail(id);

    return this.dataSource.transaction(async (manager) => {
      const person = await this.findByIdOrFail(id, manager);
      if (dto.fullName !== undefined) person.perName = dto.fullName;
      if (dto.identityDocument !== undefined)
        person.perIdentityDocument = Number(dto.identityDocument);
      if (dto.phone !== undefined) person.perContactNumber = dto.phone;
      person.perUpdateDate = new Date();
      await manager.save(person);

      if (dto.roles !== undefined) {
        await this.validateAssignableRoles(dto.roles);
        await this.replaceRoles(manager, id, dto.roles);
      }

      return this.toResponse(manager, id);
    });
  }

  async updateStatus(
    id: number,
    dto: UpdateUserStatusDto,
  ): Promise<UserResponse> {
    const person = await this.findByIdOrFail(id);
    person.perState = STATUS_TO_STATE[dto.status];
    person.perUpdateDate = new Date();
    await this.personRepository.save(person);

    if (dto.status === 'blocked') {
      await this.revokeActiveSessions(id);
    }

    // `dto.reason` se acepta por compatibilidad con el contrato de la API,
    // pero todavia no hay una columna/tabla de bitacora donde persistirlo.
    return this.toResponse(this.dataSource.manager, id);
  }

  async remove(id: number): Promise<void> {
    await this.findByIdOrFail(id);

    const associated = await this.findAssociatedRecords(id);
    if (Object.keys(associated).length > 0) {
      throw new ConflictException({
        error: 'USER_HAS_RECORDS',
        message:
          'No se puede eliminar: el usuario tiene registros asociados. Use la desactivacion en su lugar.',
        details: associated,
      });
    }

    try {
      await this.dataSource.transaction(async (manager) => {
        await manager.delete(PersonRol, { perId: id });
        await manager.delete(Person, { perId: id });
      });
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new ConflictException({
          error: 'USER_HAS_RECORDS',
          message:
            'No se puede eliminar: el usuario tiene registros asociados. Use la desactivacion en su lugar.',
          details: {},
        });
      }
      throw error;
    }
  }

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

  private async findAssignableRoleOrFail(roleId: number): Promise<Rol> {
    const role = await this.rolRepository.findOneBy({ rolId: roleId });
    if (!role || !ASSIGNABLE_ROLES.includes(role.rolDescription as never)) {
      throw new BadRequestException({
        error: 'INVALID_ROLE',
        message: 'Debe asignar un rol valido para cuentas del sistema',
        details: { roleId },
      });
    }
    return role;
  }

  private async validateAssignableRoles(
    roles: AssignedRoleDto[],
  ): Promise<void> {
    await Promise.all(roles.map((role) => this.findAssignableRoleOrFail(role.roleId)));
  }

  private async replaceRoles(
    manager: EntityManager,
    personId: number,
    roles: AssignedRoleDto[],
  ): Promise<void> {
    const keepIds = roles.map((role) => role.roleId);
    await manager
      .createQueryBuilder()
      .delete()
      .from(PersonRol)
      .where('per_id = :personId', { personId })
      .andWhere(keepIds.length > 0 ? 'rol_id NOT IN (:...keepIds)' : '1=1', {
        keepIds,
      })
      .execute();

    for (const role of roles) {
      const existing = await manager.findOneBy(PersonRol, {
        perId: personId,
        rolId: role.roleId,
      });
      if (existing) {
        existing.active = role.active;
        await manager.save(existing);
      } else {
        await manager.save(
          manager.create(PersonRol, {
            perId: personId,
            rolId: role.roleId,
            active: role.active,
            assignedAt: new Date(),
          }),
        );
      }
    }
  }

  private async revokeActiveSessions(personId: number): Promise<void> {
    await this.dataSource.query(
      'UPDATE auth_sessions SET auth_session_revoked_at = now() WHERE use_id = $1 AND auth_session_revoked_at IS NULL',
      [personId],
    );
  }

  private async findAssociatedRecords(
    personId: number,
  ): Promise<Record<string, number | boolean>> {
    const [appointments, schedule, dependents, hasAccount] = await Promise.all([
      this.appointmentRepository
        .createQueryBuilder('appointment')
        .where('appointment.req_id = :id', { id: personId })
        .orWhere('appointment.app_patient_person_id = :id', { id: personId })
        .orWhere('appointment.psy_id = :id', { id: personId })
        .orWhere('appointment.sec_id = :id', { id: personId })
        .getCount(),
      this.scheduleRepository.count({
        where: { psychologistUserId: personId },
      }),
      this.requesterDependentRepository.count({
        where: { requesterPersonId: personId },
      }),
      this.userAccountRepository.exists({ where: { useId: personId } }),
    ]);

    const associated: Record<string, number | boolean> = {};
    if (appointments > 0) associated.appointments = appointments;
    if (schedule > 0) associated.schedule = schedule;
    if (dependents > 0) associated.dependents = dependents;
    if (hasAccount) associated.account = true;
    return associated;
  }

  private async toResponse(
    manager: EntityManager,
    personId: number,
    preloaded?: Person,
  ): Promise<UserResponse> {
    const person = preloaded ?? (await this.findByIdOrFail(personId, manager));
    const [roles, account] = await Promise.all([
      manager
        .createQueryBuilder(PersonRol, 'pr')
        .innerJoin(Rol, 'rol', 'rol.rol_id = pr.rol_id')
        .where('pr.per_id = :personId', { personId })
        .select(['pr.rolId AS "rolId"', 'pr.active AS "active"', 'rol.rolDescription AS "name"'])
        .getRawMany<{ rolId: number; active: boolean; name: string }>(),
      manager.findOneBy(UserAccount, { useId: personId }),
    ]);

    const userRoles: UserRoleResponse[] = roles.map((role) => ({
      id: role.rolId,
      name: role.name,
      active: role.active,
    }));

    return {
      id: person.perId,
      fullName: person.perName,
      identityDocument: person.perIdentityDocument?.toString() ?? null,
      email: person.perEmail,
      phone: person.perContactNumber,
      roles: userRoles,
      status: STATE_TO_STATUS[person.perState],
      lastLoginAt: account?.lastLoginAt?.toISOString() ?? null,
    };
  }
}

function isForeignKeyViolation(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) return false;
  const driverError = error.driverError as { code?: string } | undefined;
  return driverError?.code === FOREIGN_KEY_VIOLATION;
}

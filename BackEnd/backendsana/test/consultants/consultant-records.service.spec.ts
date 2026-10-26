import { ConflictException } from '@nestjs/common';
import { validate } from 'class-validator';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConsultantsService } from '../../src/consultants/consultants.service.js';
import { CreateConsultantDto } from '../../src/consultants/dto/create-consultant.dto.js';
import { Appointment } from '../../src/users/entities/appointment.entity.js';
import { Person } from '../../src/users/entities/person.entity.js';

function setup() {
  const person = Object.assign(new Person(), {
    perId: 41,
    perName: 'Ana Consultante',
    perCardType: 'CC',
    perIdentityDocument: '12345678',
    perEmail: 'ana@example.com',
    perContactNumber: '3001234567',
    perBirthdate: '1990-01-01',
    perGender: 'F',
    perResidenceZone: 'Centro',
    perState: 'activo',
    perCreatedBy: 7,
    perCreatedAt: new Date('2026-01-01T00:00:00.000Z'),
    perUpdateDate: null,
  });
  const manager = {
    create: vi.fn((entity: unknown, fields: object) =>
      Object.assign(entity === Person ? new Person() : {}, fields),
    ),
    save: vi.fn(async (entity: object) =>
      entity instanceof Person
        ? Object.assign(entity, { perId: 41 })
        : entity,
    ),
    findOneBy: vi.fn().mockResolvedValue(person),
    find: vi.fn().mockResolvedValue([]),
    findOne: vi.fn().mockResolvedValue(null),
    query: vi.fn(async (sql: string) => {
      if (sql.includes('SELECT EXISTS')) return [{ exists: true }];
      if (sql.includes('SELECT pd_id')) return [{ pd_id: 12 }];
      return [];
    }),
  };
  const dataSource = {
    manager,
    transaction: vi.fn(async (operation: (transactionManager: typeof manager) => unknown) =>
      operation(manager),
    ),
  };
  const personRepository = { findOne: vi.fn().mockResolvedValue(null) };
  const personRolRepository = { exists: vi.fn().mockResolvedValue(true) };
  const service = new ConsultantsService(
    personRepository as never,
    personRolRepository as never,
    {} as never,
    {} as never,
    {} as never,
    dataSource as never,
  );

  return { service, person, manager, dataSource, personRepository, personRolRepository };
}

const consultantDto = (): CreateConsultantDto =>
  Object.assign(new CreateConsultantDto(), {
    fullName: 'Ana Consultante',
    cardType: 'CC',
    identityDocument: '12345678',
    email: ' ANA@EXAMPLE.COM ',
    phone: '3001234567',
    birthdate: '1990-01-01',
    gender: 'F',
    termsAccepted: true,
    residenceZone: '  Centro  ',
  });

describe('ConsultantsService consultant records (HU-2.1)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a consultant with normalized contact data, residence zone, role and consent', async () => {
    const { service, manager, personRepository } = setup();

    const result = await service.create(consultantDto(), 7);

    expect(personRepository.findOne).toHaveBeenCalledWith({
      where: { perIdentityDocument: '12345678' },
    });
    const createdPerson = manager.create.mock.calls[0][1] as Person;
    expect(createdPerson).toMatchObject({
      perName: 'Ana Consultante',
      perEmail: 'ana@example.com',
      perResidenceZone: 'Centro',
      perState: 'activo',
      perCreatedBy: 7,
    });
    expect(manager.create).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ rolId: 3, active: true }),
    );
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO policy_acceptance'),
      [41, 12],
    );
    expect(result).toMatchObject({
      id: 41,
      email: 'ana@example.com',
      residenceZone: 'Centro',
      termsAccepted: true,
    });
  });

  it('rejects a duplicate identity document without starting a transaction', async () => {
    const { service, dataSource, personRepository } = setup();
    personRepository.findOne.mockResolvedValue({
      perId: 9,
      perName: 'Existing Consultant',
    });

    await expect(service.create(consultantDto(), 7)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('validates required registration fields and the residence-zone length', async () => {
    const dto = Object.assign(consultantDto(), {
      fullName: '',
      identityDocument: '',
      email: '',
      phone: '',
      residenceZone: 'z'.repeat(256),
    });

    const errors = await validate(dto);
    const invalidProperties = errors.map((error) => error.property);

    expect(invalidProperties).toEqual(
      expect.arrayContaining([
        'fullName',
        'identityDocument',
        'email',
        'phone',
        'residenceZone',
      ]),
    );
  });

  it('returns the administrative consultant record with residence and without clinical fields', async () => {
    const { service, person, personRepository, personRolRepository } = setup();
    personRepository.findOne.mockResolvedValue(person);

    const result = await service.findOne(41);

    expect(personRepository.findOne).toHaveBeenCalledWith({
      where: { perId: 41 },
    });
    expect(personRolRepository.exists).toHaveBeenCalledWith({
      where: { perId: 41, rolId: 3 },
    });
    expect(result).toMatchObject({
      id: 41,
      fullName: person.perName,
      residenceZone: 'Centro',
      appointmentCount: 0,
      termsAccepted: true,
    });
    expect(result).not.toHaveProperty('appointments');
    expect(result).not.toHaveProperty('careRecords');
  });

  it('includes appointment history and assigned professional in the administrative record', async () => {
    const { service, person, manager, personRepository } = setup();
    const appointmentDate = new Date('2026-10-02T15:00:00.000Z');
    personRepository.findOne.mockResolvedValue(person);
    manager.find.mockResolvedValueOnce([
      Object.assign(new Appointment(), {
        appCreatedAt: appointmentDate,
        psychologistUserId: null,
      }),
    ]);

    const result = await service.findOne(41);

    expect(result.appointmentCount).toBe(1);
    expect(result.lastAppointmentDate).toBe(appointmentDate.toISOString());
  });

  it('updates administrative fields and trims the new residence zone', async () => {
    const { service, person, manager } = setup();

    const result = await service.update(
      41,
      { fullName: 'Ana Actualizada', residenceZone: '  Oriente  ' },
      7,
    );

    expect(person.perName).toBe('Ana Actualizada');
    expect(person.perResidenceZone).toBe('Oriente');
    expect(manager.save).toHaveBeenCalledWith(person);
    expect(result).toMatchObject({
      id: 41,
      fullName: 'Ana Actualizada',
      residenceZone: 'Oriente',
    });
  });
});

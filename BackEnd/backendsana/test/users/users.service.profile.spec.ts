import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { DataSource, EntityManager } from 'typeorm';
import { Person } from '../../src/users/entities/person.entity.js';
import { UsersService } from '../../src/users/users.service.js';

describe('UsersService self-service profile', () => {
  function setup() {
    const person = Object.assign(new Person(), {
      perId: 84,
      perName: 'Ana',
      perCardType: 'CC',
      perIdentityDocument: '12345678',
      perEmail: 'ana@example.com',
      perContactNumber: '3001234567',
      perState: 'activo',
      perUpdateDate: null,
      perCreatedBy: null,
      perBirthdate: '1990-01-01',
      perGender: 'F',
      perCreatedAt: new Date('2020-01-01T00:00:00.000Z'),
      perResidenceZone: 'Pitalito, Huila',
      perVulnerabilities: ['desplazamiento'],
    });
    const manager = {
      findOneBy: vi.fn().mockResolvedValue(person),
      save: vi.fn(async (updatedPerson: Person) => updatedPerson),
    };
    const dataSource = {
      manager: {
        findOneBy: vi.fn().mockResolvedValue(person),
      },
      transaction: vi.fn(
        async (operation: (transactionManager: EntityManager) => unknown) =>
          operation(manager as unknown as EntityManager),
      ),
    };
    const service = new UsersService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      dataSource as unknown as DataSource,
      {} as never,
    );

    return { service, person, manager, dataSource };
  }

  it('allows a consultant to update consultant profile fields', async () => {
    const { service, person, manager } = setup();

    await expect(
      service.updateOwnProfile(84, ['consultante'], {
        fullName: 'Ana Nueva',
        birthdate: null,
        vulnerabilities: [],
      }),
    ).resolves.toMatchObject({
      fullName: 'Ana Nueva',
      birthdate: null,
      vulnerabilities: [],
    });

    expect(person.perName).toBe('Ana Nueva');
    expect(person.perBirthdate).toBeNull();
    expect(person.perVulnerabilities).toEqual([]);
    expect(manager.save).toHaveBeenCalledWith(person);
  });

  it('limits employees to name and phone and does not expose consultant-only fields', async () => {
    const { service, person } = setup();

    await expect(
      service.updateOwnProfile(84, ['secretario'], {
        vulnerabilities: ['desplazamiento'],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    await expect(
      service.getOwnProfile(84, ['secretario']),
    ).resolves.toMatchObject({
      fullName: 'Ana',
      vulnerabilities: null,
      residenceZone: null,
    });
    expect(person.perVulnerabilities).toEqual(['desplazamiento']);
  });

  it('does not allow self-service updates to identity or account access fields', async () => {
    const { service, dataSource } = setup();
    const maliciousPayload = {
      fullName: 'Ana',
      email: 'other@example.com',
    };

    await expect(
      service.updateOwnProfile(84, ['consultante'], maliciousPayload),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});

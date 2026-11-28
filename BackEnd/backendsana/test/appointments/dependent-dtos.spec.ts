import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateDependentDto } from '../../src/appointments/dto/create-dependent.dto.js';
import { CreateDependentAppointmentDto } from '../../src/appointments/dto/create-dependent-appointment.dto.js';

async function invalidDependentProps(overrides: Record<string, unknown> = {}) {
  const instance = plainToInstance(CreateDependentDto, {
    name: 'Samuel Esteban',
    identityDocument: '1190001001',
    birthdate: '2016-05-14',
    gender: 'M',
    relationshipId: 1,
    ...overrides,
  });
  return (await validate(instance)).map((error) => error.property);
}

async function invalidDependentAppointmentProps(
  overrides: Record<string, unknown> = {},
) {
  const instance = plainToInstance(CreateDependentAppointmentDto, {
    appType: 'virtual',
    dependentTermsAccepted: true,
    ...overrides,
  });
  return (await validate(instance)).map((error) => error.property);
}

describe('CreateDependentDto', () => {
  it('accepts valid minor dependent data', async () => {
    await expect(invalidDependentProps()).resolves.toEqual([]);
  });

  it('keeps gender optional', async () => {
    await expect(invalidDependentProps({ gender: undefined })).resolves.toEqual([]);
  });

  it.each([
    ['short document', { identityDocument: '12345' }, 'identityDocument'],
    ['non-numeric document', { identityDocument: '12345AB' }, 'identityDocument'],
    ['blank name', { name: '' }, 'name'],
    ['invalid gender', { gender: 'X' }, 'gender'],
    ['invalid birthdate', { birthdate: 'not-a-date' }, 'birthdate'],
    ['non-positive relationshipId', { relationshipId: 0 }, 'relationshipId'],
  ])('rejects %s', async (_label, overrides, expectedProp) => {
    await expect(invalidDependentProps(overrides)).resolves.toContain(expectedProp);
  });
});

describe('CreateDependentAppointmentDto', () => {
  it('accepts a valid request without slot', async () => {
    await expect(invalidDependentAppointmentProps()).resolves.toEqual([]);
  });

  it('accepts optional appDate and appReason', async () => {
    await expect(
      invalidDependentAppointmentProps({
        appType: 'presencial',
        appDate: '2099-05-01T14:00:00-05:00',
        appReason: 'Seguimiento escolar y emocional',
      }),
    ).resolves.toEqual([]);
  });

  it.each([
    ['invalid appType', { appType: 'telefonica' }, 'appType'],
    ['invalid appDate', { appDate: '2099/99/99' }, 'appDate'],
    ['non-boolean consent', { dependentTermsAccepted: 'true' }, 'dependentTermsAccepted'],
    ['too-long appReason', { appReason: 'a'.repeat(1001) }, 'appReason'],
  ])('rejects %s', async (_label, overrides, expectedProp) => {
    await expect(
      invalidDependentAppointmentProps(overrides),
    ).resolves.toContain(expectedProp);
  });
});

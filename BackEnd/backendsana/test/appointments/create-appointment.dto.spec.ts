import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateAppointmentDto } from '../../src/appointments/dto/create-appointment.dto.js';

function dto(overrides: Record<string, unknown> = {}) {
  return plainToInstance(CreateAppointmentDto, {
    requesterName: 'Ana Solicitante',
    requesterCardType: 'CC',
    requesterIdentityDocument: '10212265698',
    requesterContactNumber: '3001234567',
    requesterEmail: 'ana@example.com',
    requesterBirthdate: '1990-01-01',
    requesterTermsAccepted: true,
    patientType: 'self',
    appType: 'virtual',
    ...overrides,
  });
}

async function invalidProperties(overrides: Record<string, unknown>) {
  return (await validate(dto(overrides))).map((error) => error.property);
}

describe('CreateAppointmentDto legal fields', () => {
  it('keeps channel and vulnerabilities optional', async () => {
    await expect(invalidProperties({})).resolves.toEqual([]);
  });

  it.each(['web', 'telefono', 'whatsapp', 'presencial'])(
    'accepts the known channel %s',
    async (channel) => {
      await expect(invalidProperties({ channel })).resolves.toEqual([]);
    },
  );

  it.each(['email', 'WEB', ''])('rejects the unknown channel "%s"', async (channel) => {
    await expect(invalidProperties({ channel })).resolves.toContain('channel');
  });

  it('accepts a list of vulnerabilities', async () => {
    await expect(
      invalidProperties({ vulnerabilities: ['Población migrante', 'Adulto mayor'] }),
    ).resolves.toEqual([]);
  });

  it.each([
    ['a plain string', 'Población migrante'],
    ['an empty value', ['']],
    ['a non-string value', [3]],
    ['a value longer than 75 characters', ['x'.repeat(76)]],
  ])('rejects vulnerabilities given as %s', async (_label, vulnerabilities) => {
    await expect(invalidProperties({ vulnerabilities })).resolves.toContain(
      'vulnerabilities',
    );
  });
});

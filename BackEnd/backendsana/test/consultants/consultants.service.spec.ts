import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ConsultantsService } from '../../src/consultants/consultants.service.js';

function setup() {
  const dataSource = { query: vi.fn() };
  const service = new ConsultantsService(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    dataSource as never,
  );

  return { service, dataSource };
}

describe('ConsultantsService psychologist views', () => {
  it('lists only people with active, completed, or waiting appointments assigned to the psychologist', async () => {
    const { service, dataSource } = setup();
    dataSource.query.mockResolvedValue([]);

    await expect(service.findMineForPsychologist(82)).resolves.toEqual([]);

    const [sql, params] = dataSource.query.mock.calls[0] as [string, number[]];
    expect(params).toEqual([82]);
    expect(sql).toContain('WHERE a.psy_id = $1');
    expect(sql).toContain("COALESCE(req.per_contact_number::text, '') AS \"phone\"");
    expect(sql).not.toContain("COALESCE(req.per_contact_number, '')");
    expect(sql).toContain("a.app_state IN ('asignada', 'confirmada', 'realizada')");
    expect(sql).toContain('"completedAppointmentCount"');
    expect(sql).toContain('"waitingAppointmentCount"');
  });

  it('groups appointments and clinical notes for the treating psychologist', async () => {
    const { service, dataSource } = setup();
    dataSource.query
      .mockResolvedValueOnce([
        {
          id: 41,
          fullName: 'Consultante',
          identityDocument: '123',
          email: 'consultante@example.com',
          phone: '3000000000',
          residence: null,
          status: 'active',
          assignedPsychologistId: 82,
          assignedPsychologistName: null,
          lastAppointmentAt: new Date('2026-10-01T15:00:00.000Z'),
          appointmentCount: 1,
          completedAppointmentCount: 1,
          waitingAppointmentCount: 0,
        },
      ])
      .mockResolvedValueOnce([
        {
          appId: 17,
          appState: 'realizada',
          appDate: new Date('2026-10-01T15:00:00.000Z'),
          appDuration: 60,
          appReason: 'Motivo específico de esta cita',
          patientType: 'dependent',
          patientName: 'Menor',
          patientDependentId: 93,
          psychologistName: 'Psicólogo tratante',
          cnId: 5,
          cnObservation: 'Primera nota',
          cnCreatedAt: new Date('2026-10-01T16:00:00.000Z'),
        },
        {
          appId: 17,
          appState: 'realizada',
          appDate: new Date('2026-10-01T15:00:00.000Z'),
          appDuration: 60,
          appReason: 'Motivo específico de esta cita',
          psychologistName: 'Psicólogo tratante',
          cnId: 6,
          cnObservation: 'Segunda nota',
          cnCreatedAt: new Date('2026-10-01T16:30:00.000Z'),
        },
      ]);

    const record = await service.findFullForPsychologist(41, 82);

    expect(record.appointments).toHaveLength(1);
    expect(record.appointments[0].reason).toBe(
      'Motivo específico de esta cita',
    );
    expect(record.appointments[0]).toMatchObject({
      patientType: 'dependent',
      patientName: 'Menor',
      patientDependentId: 93,
    });
    expect(record.appointments[0].clinicalNotes).toHaveLength(2);
    expect(record.careRecords).toHaveLength(2);
    expect(record.careRecords[0]).toMatchObject({
      patientType: 'dependent',
      patientName: 'Menor',
      patientDependentId: 93,
    });
    expect(dataSource.query.mock.calls[0][1]).toEqual([41, 82]);
    expect(dataSource.query.mock.calls[1][1]).toEqual([41, 82]);
    expect(dataSource.query.mock.calls[0][0]).toContain(
      "COALESCE(req.per_contact_number::text, '') AS \"phone\"",
    );
    expect(dataSource.query.mock.calls[1][0]).not.toContain(
      "COALESCE(req.per_contact_number, '')",
    );
    expect(dataSource.query.mock.calls[1][0]).toContain('cn.psy_id = a.psy_id');
    expect(dataSource.query.mock.calls[1][0]).toContain(
      'a.app_patient_dependent_id AS "patientDependentId"',
    );
    expect(dataSource.query.mock.calls[1][0]).toContain(
      'LEFT JOIN dependents dep ON dep.dep_id = a.app_patient_dependent_id',
    );
  });

  it('denies access when the consultant has no appointment assigned to the psychologist', async () => {
    const { service, dataSource } = setup();
    dataSource.query.mockResolvedValue([]);

    await expect(service.findFullForPsychologist(41, 82)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(dataSource.query).toHaveBeenCalledOnce();
  });
});

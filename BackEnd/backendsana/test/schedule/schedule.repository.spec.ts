import { describe, expect, it, vi } from 'vitest';
import { ScheduleRepository } from '../../src/schedule/schedule.repository.js';

describe('ScheduleRepository.confirmWithSchedule', () => {
  it('confirms a pending request and upserts its occupancy in one transaction', async () => {
    const manager = { query: vi.fn() };
    const dataSource = { query: vi.fn(), transaction: vi.fn() };
    manager.query
      .mockResolvedValueOnce([{ psy_id: null, app_state: 'pendiente' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ exists: true }])
      .mockResolvedValueOnce([{ exists: false }])
      .mockResolvedValueOnce([{ exists: false }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    dataSource.transaction.mockImplementation(async (callback) => callback(manager));

    const repository = new ScheduleRepository(dataSource as never);
    await expect(
      repository.confirmWithSchedule({
        appId: 42,
        secretaryUserId: 3,
        psyId: 8,
        appDate: new Date('2026-10-06T09:00:00.000Z'),
        appDuration: 60,
      }),
    ).resolves.toBe('confirmed');

    expect(dataSource.transaction).toHaveBeenCalledOnce();
    expect(manager.query).toHaveBeenCalledTimes(8);
    expect(manager.query.mock.calls[4][0]).toContain('app_id IS DISTINCT FROM $5');
    expect(manager.query.mock.calls[4][1]).toEqual([
      8,
      '2026-10-06',
      '09:00:00',
      60,
      42,
    ]);
    expect(manager.query.mock.calls[6][0]).toContain("app_state = 'confirmada'");
    expect(manager.query.mock.calls[7][0]).toContain('ON CONFLICT (app_id) DO UPDATE');
  });
});

describe('ScheduleRepository.findAvailability', () => {
  it('requires the complete appointment duration to fit within availability blocks', async () => {
    const dataSource = { query: vi.fn().mockResolvedValue([]) };
    const repository = new ScheduleRepository(dataSource as never);

    await repository.findAvailability({
      appointmentStart: '2026-10-06T09:00:00.000Z',
      duration: 60,
      delayHours: 8,
    });

    const sql = dataSource.query.mock.calls[0][0] as string;
    expect(sql).toContain('b.sch_start_time <= s.start_at::time');
    expect(sql).toContain('b.sch_end_time >= (s.start_at + ($3 ||');
    expect(sql).toContain('r.srb_start_time <= s.start_at::time');
    expect(sql).toContain('r.srb_end_time >= (s.start_at + ($3 ||');
  });
});
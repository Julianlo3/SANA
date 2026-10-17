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
    expect(sql).toContain('FROM schedule_occupancy o');
    expect(sql).toContain("a.app_state IN ('asignada', 'confirmada')");
    expect(sql).toContain('a.app_date < s.start_at + ($3 ||');
    expect(sql).toContain(
      "a.app_date + (a.app_duration || ' minutes')::interval > s.start_at",
    );
  });
});

describe('ScheduleRepository.findCalendar', () => {
  it('returns availability, occupancy, and recurring rules separately in a single query', async () => {
    const calendar = { availability: [], occupancy: [], recurring: [] };
    const dataSource = { query: vi.fn().mockResolvedValue([calendar]) };
    const repository = new ScheduleRepository(dataSource as never);

    await expect(repository.findCalendar(5)).resolves.toBe(calendar);

    const [sql, params] = dataSource.query.mock.calls[0] as [string, number[]];
    expect(params).toEqual([5]);
    expect(sql).toContain('FROM schedule');
    expect(sql).toContain('AS availability');
    expect(sql).toContain('FROM schedule_occupancy');
    expect(sql).toContain("'sourceType', source_type");
    expect(sql).toContain('AS occupancy');
    expect(sql).toContain('FROM schedule_recurring_blocks');
    expect(sql).toContain("'dayOfWeek', srb_day_of_week");
    expect(sql).toContain("'validFrom', srb_valid_from::text");
    expect(sql).toContain("'validUntil', srb_valid_until::text");
    expect(sql).toContain("'active', srb_active");
    expect(sql).toContain('AS recurring');
    expect(sql).not.toContain('generate_series');
  });
});
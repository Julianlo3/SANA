import { describe, expect, it, vi } from 'vitest';
import {
  GoogleCalendarService,
  type GoogleCalendarClient,
} from '../../src/calendar/google-calendar.service.js';

function mockConfig(values: Record<string, string> = {}) {
  return {
    get: vi.fn((key: string) => values[key]),
  };
}

describe('GoogleCalendarService', () => {
  it('reports isConfigured as false when environment variables are missing', () => {
    const service = new GoogleCalendarService(mockConfig() as never);
    expect(service.isConfigured()).toBe(false);
  });

  it('skips event creation when not configured and returns null', async () => {
    const service = new GoogleCalendarService(mockConfig() as never);
    const result = await service.createAppointmentEvent({
      appId: 10,
      patientName: 'Juan Perez',
      requesterEmail: 'juan@example.com',
      appDate: new Date('2026-12-01T10:00:00Z'),
    });
    expect(result).toBeNull();
  });

  it('creates an event with attendees and returns event ID when configured', async () => {
    const mockClient: GoogleCalendarClient = {
      events: {
        insert: vi.fn().mockResolvedValue({ data: { id: 'calendar-event-123' } }),
        delete: vi.fn().mockResolvedValue({}),
      },
    };

    const service = new GoogleCalendarService(mockConfig() as never, mockClient);
    expect(service.isConfigured()).toBe(true);

    const result = await service.createAppointmentEvent({
      appId: 42,
      patientName: 'Maria Lopez',
      requesterEmail: 'maria@example.com',
      psychologistName: 'Dra. Andrea',
      psychologistEmail: 'andrea@sana.org',
      appDate: '2026-11-20T15:00:00.000Z',
      appDuration: 45,
      appType: 'virtual',
    });

    expect(result).toBe('calendar-event-123');
    expect(mockClient.events.insert).toHaveBeenCalledTimes(1);

    const callArgs = vi.mocked(mockClient.events.insert).mock.calls[0][0];
    expect(callArgs.calendarId).toBe('primary');
    expect(callArgs.sendUpdates).toBe('all');
    expect(callArgs.requestBody?.summary).toContain('Maria Lopez');
    expect(callArgs.requestBody?.attendees).toEqual([
      { email: 'maria@example.com', displayName: 'Maria Lopez' },
      { email: 'andrea@sana.org', displayName: 'Dra. Andrea' },
    ]);
  });

  it('ignores placeholder emails for attendees', async () => {
    const mockClient: GoogleCalendarClient = {
      events: {
        insert: vi.fn().mockResolvedValue({ data: { id: 'evt-placeholder-test' } }),
        delete: vi.fn(),
      },
    };

    const service = new GoogleCalendarService(mockConfig() as never, mockClient);

    await service.createAppointmentEvent({
      appId: 99,
      patientName: 'Carlos',
      requesterEmail: 'doc_12345@sana.org', // placeholder
      psychologistEmail: 'psy@example.com',
      appDate: '2026-11-20T10:00:00.000Z',
    });

    const callArgs = vi.mocked(mockClient.events.insert).mock.calls[0][0];
    expect(callArgs.requestBody?.attendees).toEqual([
      { email: 'psy@example.com', displayName: 'Profesional SANA' },
    ]);
  });

  it('returns null gracefully when insert throws an error', async () => {
    const mockClient: GoogleCalendarClient = {
      events: {
        insert: vi.fn().mockRejectedValue(new Error('Google API network error')),
        delete: vi.fn(),
      },
    };

    const service = new GoogleCalendarService(mockConfig() as never, mockClient);
    const result = await service.createAppointmentEvent({
      appId: 50,
      patientName: 'Error Test',
      appDate: '2026-11-20T10:00:00.000Z',
    });

    expect(result).toBeNull();
  });

  it('deletes an event successfully with sendUpdates all', async () => {
    const mockClient: GoogleCalendarClient = {
      events: {
        insert: vi.fn(),
        delete: vi.fn().mockResolvedValue({}),
      },
    };

    const service = new GoogleCalendarService(mockConfig() as never, mockClient);
    const success = await service.deleteAppointmentEvent('evt-to-delete');

    expect(success).toBe(true);
    expect(mockClient.events.delete).toHaveBeenCalledWith({
      calendarId: 'primary',
      eventId: 'evt-to-delete',
      sendUpdates: 'all',
    });
  });

  it('handles 404 on event deletion as success', async () => {
    const error404 = new Error('Not found') as Error & { code: number };
    error404.code = 404;

    const mockClient: GoogleCalendarClient = {
      events: {
        insert: vi.fn(),
        delete: vi.fn().mockRejectedValue(error404),
      },
    };

    const service = new GoogleCalendarService(mockConfig() as never, mockClient);
    const success = await service.deleteAppointmentEvent('evt-404');

    expect(success).toBe(true);
  });
});


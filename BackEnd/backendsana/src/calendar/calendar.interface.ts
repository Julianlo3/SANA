export interface CreateCalendarEventParams {
  appId: number;
  patientName: string;
  requesterEmail?: string | null;
  psychologistName?: string | null;
  psychologistEmail?: string | null;
  appDate: Date | string;
  appDuration?: number | null;
  appType?: 'presencial' | 'virtual' | string | null;
}

export interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string;
  calendarId: string;
}

export interface CalendarEventPayload {
  summary: string;
  description: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  attendees: Array<{ email: string; displayName?: string }>;
}


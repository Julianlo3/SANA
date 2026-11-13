import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { calendar_v3, google } from 'googleapis';
import type {
  CreateCalendarEventParams,
  GoogleCalendarConfig,
} from './calendar.interface.js';

export const GOOGLE_CALENDAR_CLIENT = Symbol('GOOGLE_CALENDAR_CLIENT');

export interface GoogleCalendarClient {
  events: {
    insert(params: calendar_v3.Params$Resource$Events$Insert): Promise<{ data: calendar_v3.Schema$Event }>;
    delete(params: calendar_v3.Params$Resource$Events$Delete): Promise<unknown>;
  };
}

@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);
  private client: GoogleCalendarClient | null = null;
  private calendarId = 'primary';
  private configured = false;

  constructor(
    private readonly configService: ConfigService,
    @Optional()
    @Inject(GOOGLE_CALENDAR_CLIENT)
    injectedClient?: GoogleCalendarClient,
  ) {
    if (injectedClient) {
      this.client = injectedClient;
      this.configured = true;
    } else {
      this.initializeClient();
    }
  }

  /**
   * Initializes the Google Calendar OAuth2 client using environment variables.
   */
  private initializeClient(): void {
    const config = this.readConfig();
    if (!config) {
      this.logger.warn('Google Calendar is disabled: credentials are not configured');
      return;
    }

    try {
      const auth = new google.auth.OAuth2(
        config.clientId,
        config.clientSecret,
        config.redirectUri,
      );
      auth.setCredentials({ refresh_token: config.refreshToken });
      this.calendarId = config.calendarId;
      this.client = google.calendar({ version: 'v3', auth });
      this.configured = true;
      this.logger.log('Google Calendar service initialized successfully');
    } catch (error) {
      this.logger.warn(`Failed to initialize Google Calendar client: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Reads Google Calendar configuration from environment variables, falling back
   * to Gmail OAuth variables if specific Calendar ones are not provided.
   */
  private readConfig(): GoogleCalendarConfig | null {
    const clientId =
      this.configService.get<string>('GOOGLE_CALENDAR_CLIENT_ID')?.trim() ||
      this.configService.get<string>('GMAIL_CLIENT_ID')?.trim();
    const clientSecret =
      this.configService.get<string>('GOOGLE_CALENDAR_CLIENT_SECRET')?.trim() ||
      this.configService.get<string>('GMAIL_CLIENT_SECRET')?.trim();
    const redirectUri =
      this.configService.get<string>('GOOGLE_CALENDAR_REDIRECT_URI')?.trim() ||
      this.configService.get<string>('GMAIL_REDIRECT_URI')?.trim();
    const refreshToken =
      this.configService.get<string>('GOOGLE_CALENDAR_REFRESH_TOKEN')?.trim() ||
      this.configService.get<string>('GMAIL_REFRESH_TOKEN')?.trim();
    const calendarId =
      this.configService.get<string>('GOOGLE_CALENDAR_ID')?.trim() || 'primary';

    if (!clientId || !clientSecret || !redirectUri || !refreshToken) {
      return null;
    }

    return { clientId, clientSecret, redirectUri, refreshToken, calendarId };
  }

  /**
   * Indicates whether Google Calendar integration is fully configured and ready.
   */
  isConfigured(): boolean {
    return this.configured && this.client !== null;
  }

  /**
   * Creates an appointment event in Google Calendar with the consultant and
   * psychologist added as attendees (sendUpdates: 'all' automatically invites them
   * and places the event on their Google Calendar).
   *
   * @param params Details of the appointment to schedule.
   * @returns The Google Calendar event ID, or null if creation failed or was skipped.
   */
  async createAppointmentEvent(
    params: CreateCalendarEventParams,
  ): Promise<string | null> {
    if (!this.isConfigured() || !this.client) {
      this.logger.warn(
        `Google Calendar event skipped: service is not configured (appId-${params.appId})`,
      );
      return null;
    }

    const startDate = new Date(params.appDate);
    if (Number.isNaN(startDate.getTime())) {
      this.logger.warn(
        `Google Calendar event skipped: invalid appointment date (appId-${params.appId})`,
      );
      return null;
    }

    const durationMinutes =
      params.appDuration && params.appDuration > 0 ? params.appDuration : 60;
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    const attendees: Array<{ email: string; displayName?: string }> = [];

    if (
      params.requesterEmail &&
      !this.isPlaceholderEmail(params.requesterEmail)
    ) {
      attendees.push({
        email: params.requesterEmail.trim().toLowerCase(),
        displayName: params.patientName,
      });
    }

    if (
      params.psychologistEmail &&
      !this.isPlaceholderEmail(params.psychologistEmail)
    ) {
      attendees.push({
        email: params.psychologistEmail.trim().toLowerCase(),
        displayName: params.psychologistName ?? 'Profesional SANA',
      });
    }

    const modalityText =
      (params.appType || '').toLowerCase() === 'virtual'
        ? 'Virtual'
        : 'Presencial';

    const summary = `Cita Psicológica SANA - ${params.patientName}`;
    const description = [
      'Atención psicológica en la Fundación Dejando Huellas Felices (SANA).',
      '',
      `Radicado: #${params.appId}`,
      `Paciente: ${params.patientName}`,
      `Profesional: ${params.psychologistName ?? 'Por confirmar'}`,
      `Modalidad: ${modalityText}`,
    ].join('\n');

    try {
      const response = await this.client.events.insert({
        calendarId: this.calendarId,
        sendUpdates: 'all',
        requestBody: {
          summary,
          description,
          start: {
            dateTime: startDate.toISOString(),
          },
          end: {
            dateTime: endDate.toISOString(),
          },
          attendees,
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 },
              { method: 'popup', minutes: 30 },
            ],
          },
        },
      });

      const eventId = response.data?.id ?? null;
      this.logger.log(
        `Google Calendar event created: appId-${params.appId}, eventId-${eventId}`,
      );
      return eventId;
    } catch (error) {
      this.logger.warn(
        `Google Calendar event could not be created (appId-${params.appId}): ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Deletes an appointment event from Google Calendar and notifies attendees.
   *
   * @param eventId The Google Calendar event ID to remove.
   * @returns True if deleted successfully (or already removed), false on failure.
   */
  async deleteAppointmentEvent(eventId: string): Promise<boolean> {
    if (!this.isConfigured() || !this.client || !eventId) {
      return false;
    }

    try {
      await this.client.events.delete({
        calendarId: this.calendarId,
        eventId,
        sendUpdates: 'all',
      });
      this.logger.log(`Google Calendar event deleted: eventId-${eventId}`);
      return true;
    } catch (error: unknown) {
      const is404 =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number | string }).code === 404;

      if (is404) {
        this.logger.log(
          `Google Calendar event already deleted or not found: eventId-${eventId}`,
        );
        return true;
      }

      this.logger.warn(
        `Google Calendar event could not be deleted (eventId-${eventId}): ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * Checks whether an email address is an internal placeholder.
   */
  private isPlaceholderEmail(email: string): boolean {
    return /^doc_\d+@sana\.org$/i.test(email.trim());
  }
}


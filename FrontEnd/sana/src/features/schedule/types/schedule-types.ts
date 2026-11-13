/**
 * Data contracts for psychologist schedule blocks.
 *
 * Time is available by default; psychologists create one-time or recurring
 * blocks for periods when they cannot take appointments.
 */

/** One-time blocked interval; a non-null appointmentId identifies a non-removable appointment. */
export type ScheduleBlock = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  appointmentId: number | null;
};

/** Weekly recurring block with an optional validity end date. */
export type RecurringScheduleBlock = {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  validFrom: string;
  validUntil: string | null;
  active: boolean;
  hasAppointments: boolean;
};

/**
 * Defines the create schedule block payload type.
 */

export type CreateScheduleBlockPayload = {
  date: string;
  startTime: string;
  endTime: string;
};

/**
 * Defines the create recurring schedule block payload type.
 */

export type CreateRecurringScheduleBlockPayload = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  validFrom: string;
  validUntil?: string;
};
/**
 * Tipos de la agenda del psicólogo (modelo de bloqueos, confirmado contra
 * el backend real tras "feat: overhaul schedule workflow").
 *
 * El modelo es el opuesto al que se discutió primero en el daily: todo
 * cuenta como disponible por defecto, y el psicólogo bloquea las horas en
 * las que NO puede atender — puntuales o recurrentes. No hay concepto de
 * "marcar mañana/tarde como disponible".
 */

/** Un bloqueo de una fecha concreta. Si appointmentId no es null, es una cita ya asignada, no un bloqueo manual: no se puede borrar desde aquí. */
export type ScheduleBlock = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  reason: string | null;
  appointmentId: number | null;
};

/** Una regla que se repite cada semana, con vigencia desde/hasta. */
export type RecurringScheduleBlock = {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  validFrom: string;
  validUntil: string | null;
  reason: string | null;
  active: boolean;
};

export type CreateScheduleBlockPayload = {
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
};

export type CreateRecurringScheduleBlockPayload = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  validFrom: string;
  validUntil?: string;
  reason: string;
};
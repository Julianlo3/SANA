import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface ReportsSummary {
  psychology: {
    totalCompletedAppointments: number;
    averageCompletedAppointmentsPerPsychologist: number;
    activePsychologists: number;
  };
  system: {
    totalConsultants: number;
    averageAppointmentsPerConsultant: number;
  };
  donations: {
    totalAmountInCents: string;
    approvedDonations: number;
    peopleWhoDonated: number;
  };
}

interface ReportsSummaryRow {
  total_completed_appointments: number;
  average_completed_appointments_per_psychologist: number;
  active_psychologists: number;
  total_consultants: number;
  average_appointments_per_consultant: number;
  total_amount_in_cents: string;
  approved_donations: number;
  people_who_donated: number;
}

/** Reads aggregate-only operational metrics from the existing database. */
@Injectable()
export class ReportsRepository {
  constructor(private readonly dataSource: DataSource) {}

  async getSummary(): Promise<ReportsSummary> {
    const [row] = await this.dataSource.query<ReportsSummaryRow[]>(`
      WITH active_psychologists AS (
        SELECT DISTINCT person_role.per_id
        FROM person_rol person_role
        INNER JOIN rol role ON role.rol_id = person_role.rol_id
        WHERE person_role.pr_active = true
          AND role.rol_description = 'psicologo'
      ),
      active_consultants AS (
        SELECT DISTINCT person_role.per_id
        FROM person_rol person_role
        INNER JOIN rol role ON role.rol_id = person_role.rol_id
        WHERE person_role.pr_active = true
          AND role.rol_description = 'consultante'
      ),
      completed_by_psychologist AS (
        SELECT psychologist.per_id, COUNT(appointment.app_id)::int AS completed_count
        FROM active_psychologists psychologist
        LEFT JOIN appointments appointment
          ON appointment.psy_id = psychologist.per_id
         AND appointment.app_state = 'realizada'
        GROUP BY psychologist.per_id
      ),
      appointments_by_consultant AS (
        SELECT consultant.per_id, COUNT(appointment.app_id)::int AS appointment_count
        FROM active_consultants consultant
        LEFT JOIN appointments appointment ON appointment.req_id = consultant.per_id
        GROUP BY consultant.per_id
      ),
      approved_donations AS (
        SELECT don_amount_in_cents, don_donor_email, don_wompi_transaction_id
        FROM donation
        WHERE don_status = 'APPROVED'
      )
      SELECT
        (SELECT COUNT(*)::int FROM appointments WHERE app_state = 'realizada') AS total_completed_appointments,
        COALESCE((SELECT AVG(completed_count)::double precision FROM completed_by_psychologist), 0) AS average_completed_appointments_per_psychologist,
        (SELECT COUNT(*)::int FROM active_psychologists) AS active_psychologists,
        (SELECT COUNT(*)::int FROM active_consultants) AS total_consultants,
        COALESCE((SELECT AVG(appointment_count)::double precision FROM appointments_by_consultant), 0) AS average_appointments_per_consultant,
        COALESCE((SELECT SUM(don_amount_in_cents) FROM approved_donations), 0)::text AS total_amount_in_cents,
        (SELECT COUNT(*)::int FROM approved_donations) AS approved_donations,
        (SELECT COUNT(DISTINCT COALESCE(NULLIF(LOWER(TRIM(don_donor_email)), ''), don_wompi_transaction_id))::int FROM approved_donations) AS people_who_donated
    `);

    return {
      psychology: {
        totalCompletedAppointments: row.total_completed_appointments,
        averageCompletedAppointmentsPerPsychologist:
          row.average_completed_appointments_per_psychologist,
        activePsychologists: row.active_psychologists,
      },
      system: {
        totalConsultants: row.total_consultants,
        averageAppointmentsPerConsultant:
          row.average_appointments_per_consultant,
      },
      donations: {
        totalAmountInCents: row.total_amount_in_cents,
        approvedDonations: row.approved_donations,
        peopleWhoDonated: row.people_who_donated,
      },
    };
  }
}

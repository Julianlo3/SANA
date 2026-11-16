import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppointmentDateBasis } from './dto/report-presets.enum.js';
import type {
  AppointmentsReportQueryDto,
  AttendanceReportQueryDto,
  DonationsEvolutionQueryDto,
  DonationsHistoryQueryDto,
} from './dto/report-query.dto.js';
import {
  compareMetrics,
  maskEmail,
  type ResolvedDateRange,
} from './reports-date.util.js';
import type {
  AppointmentsEvolutionReport,
  AttendanceReport,
  DonationsEvolutionReport,
  DonationsHistoryReport,
  GeneralManagementReport,
  ReportPeriodMetadata,
  ReportsSummary,
} from './reports.interface.js';

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

/** Reads aggregate and detailed operational metrics from the database. */
@Injectable()
export class ReportsRepository {
  constructor(private readonly dataSource: DataSource) { }

  private formatPeriod(range: ResolvedDateRange): ReportPeriodMetadata {
    return {
      startDate: range.startDate.toISOString(),
      endDate: range.endDate.toISOString(),
      previousStartDate: range.previousStartDate.toISOString(),
      previousEndDate: range.previousEndDate.toISOString(),
      preset: range.preset,
      periodLabel: range.periodLabel,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Legacy summary endpoint maintained for backwards compatibility.
   */
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

  /**
   * Report 1: General Management Report.
   */
  async getGeneralReport(range: ResolvedDateRange): Promise<GeneralManagementReport> {
    const period = this.formatPeriod(range);

    const [appointmentsCurrent] = await this.dataSource.query<
      Array<{
        total: number;
        completed: number;
        scheduled: number;
        cancelled: number;
        no_show: number;
      }>
    >(
      `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE app_state = 'realizada')::int AS completed,
        COUNT(*) FILTER (WHERE app_state IN ('pendiente', 'asignada', 'confirmada'))::int AS scheduled,
        COUNT(*) FILTER (WHERE app_state IN ('cancelada', 'descartada'))::int AS cancelled,
        COUNT(*) FILTER (WHERE app_state = 'no_asistio')::int AS no_show
      FROM appointments
      WHERE app_date >= $1 AND app_date <= $2
    `,
      [range.startDate, range.endDate],
    );

    const [appointmentsPrevious] = await this.dataSource.query<
      Array<{ total: number }>
    >(
      `
      SELECT COUNT(*)::int AS total
      FROM appointments
      WHERE app_date >= $1 AND app_date <= $2
    `,
      [range.previousStartDate, range.previousEndDate],
    );

    const [usersStats] = await this.dataSource.query<
      Array<{
        total_registered: number;
        new_registered: number;
        previous_new_registered: number;
      }>
    >(
      `
      SELECT
        (SELECT COUNT(*)::int FROM person WHERE per_created_at <= $2) AS total_registered,
        (SELECT COUNT(*)::int FROM person WHERE per_created_at >= $1 AND per_created_at <= $2) AS new_registered,
        (SELECT COUNT(*)::int FROM person WHERE per_created_at >= $3 AND per_created_at <= $4) AS previous_new_registered
    `,
      [
        range.startDate,
        range.endDate,
        range.previousStartDate,
        range.previousEndDate,
      ],
    );

    const [donationsCurrent] = await this.dataSource.query<
      Array<{ count: number; amount: string }>
    >(
      `
      SELECT
        COUNT(*)::int AS count,
        COALESCE(SUM(don_amount_in_cents), 0)::text AS amount
      FROM donation
      WHERE don_status = 'APPROVED'
        AND don_created_at >= $1 AND don_created_at <= $2
    `,
      [range.startDate, range.endDate],
    );

    const [donationsPrevious] = await this.dataSource.query<
      Array<{ count: number; amount: string }>
    >(
      `
      SELECT
        COUNT(*)::int AS count,
        COALESCE(SUM(don_amount_in_cents), 0)::text AS amount
      FROM donation
      WHERE don_status = 'APPROVED'
        AND don_created_at >= $1 AND don_created_at <= $2
    `,
      [range.previousStartDate, range.previousEndDate],
    );

    // Timeline grouping by day
    const appointmentsTimeline = await this.dataSource.query<
      Array<{
        date: string;
        appointments_count: number;
        completed_count: number;
      }>
    >(
      `
      SELECT
        TO_CHAR(app_date, 'YYYY-MM-DD') AS date,
        COUNT(*)::int AS appointments_count,
        COUNT(*) FILTER (WHERE app_state = 'realizada')::int AS completed_count
      FROM appointments
      WHERE app_date >= $1 AND app_date <= $2
      GROUP BY date
      ORDER BY date ASC
    `,
      [range.startDate, range.endDate],
    );

    const donationsTimeline = await this.dataSource.query<
      Array<{
        date: string;
        donations_count: number;
        donations_amount: string;
      }>
    >(
      `
      SELECT
        TO_CHAR(don_created_at, 'YYYY-MM-DD') AS date,
        COUNT(*)::int AS donations_count,
        COALESCE(SUM(don_amount_in_cents), 0)::text AS donations_amount
      FROM donation
      WHERE don_status = 'APPROVED'
        AND don_created_at >= $1 AND don_created_at <= $2
      GROUP BY date
      ORDER BY date ASC
    `,
      [range.startDate, range.endDate],
    );

    // Merge timelines by date
    const timelineMap = new Map<
      string,
      {
        date: string;
        appointmentsCount: number;
        completedAppointmentsCount: number;
        donationsCount: number;
        donationsAmountInCents: string;
      }
    >();

    for (const app of appointmentsTimeline) {
      timelineMap.set(app.date, {
        date: app.date,
        appointmentsCount: app.appointments_count,
        completedAppointmentsCount: app.completed_count,
        donationsCount: 0,
        donationsAmountInCents: '0',
      });
    }

    for (const don of donationsTimeline) {
      const existing = timelineMap.get(don.date);
      if (existing) {
        existing.donationsCount = don.donations_count;
        existing.donationsAmountInCents = don.donations_amount;
      } else {
        timelineMap.set(don.date, {
          date: don.date,
          appointmentsCount: 0,
          completedAppointmentsCount: 0,
          donationsCount: don.donations_count,
          donationsAmountInCents: don.donations_amount,
        });
      }
    }

    const timeline = Array.from(timelineMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    const currentDonationAmount = BigInt(donationsCurrent?.amount ?? '0');
    const previousDonationAmount = BigInt(donationsPrevious?.amount ?? '0');
    const diffDonationAmount = currentDonationAmount - previousDonationAmount;
    let donationAmountPercentage: number | null = null;
    if (previousDonationAmount > 0n) {
      donationAmountPercentage = Number(
        (
          (Number(diffDonationAmount) / Number(previousDonationAmount)) *
          100
        ).toFixed(2),
      );
    } else if (currentDonationAmount === 0n && previousDonationAmount === 0n) {
      donationAmountPercentage = 0;
    }

    return {
      period,
      appointments: {
        total: appointmentsCurrent?.total ?? 0,
        completed: appointmentsCurrent?.completed ?? 0,
        scheduled: appointmentsCurrent?.scheduled ?? 0,
        cancelled: appointmentsCurrent?.cancelled ?? 0,
        noShow: appointmentsCurrent?.no_show ?? 0,
        comparisonWithPrevious: compareMetrics(
          appointmentsCurrent?.total ?? 0,
          appointmentsPrevious?.total ?? 0,
        ),
      },
      users: {
        totalRegistered: usersStats?.total_registered ?? 0,
        newRegistered: usersStats?.new_registered ?? 0,
        comparisonWithPrevious: compareMetrics(
          usersStats?.new_registered ?? 0,
          usersStats?.previous_new_registered ?? 0,
        ),
      },
      donations: {
        confirmedDonationsCount: donationsCurrent?.count ?? 0,
        totalAmountInCents: donationsCurrent?.amount ?? '0',
        currency: 'COP',
        countComparison: compareMetrics(
          donationsCurrent?.count ?? 0,
          donationsPrevious?.count ?? 0,
        ),
        amountComparison: {
          currentAmountInCents: donationsCurrent?.amount ?? '0',
          previousAmountInCents: donationsPrevious?.amount ?? '0',
          differenceInCents: diffDonationAmount.toString(),
          percentage: donationAmountPercentage,
        },
      },
      timeline,
    };
  }

  /**
   * Report 2: Appointments Evolution Report.
   */
  async getAppointmentsEvolutionReport(
    range: ResolvedDateRange,
    query: AppointmentsReportQueryDto,
  ): Promise<AppointmentsEvolutionReport> {
    const period = this.formatPeriod(range);
    const dateBasis = query.dateBasis ?? AppointmentDateBasis.Scheduled;
    const dateCol =
      dateBasis === AppointmentDateBasis.Created
        ? 'app_created_at'
        : 'app_date';

    const conditions: string[] = [];
    const params: unknown[] = [range.startDate, range.endDate];

    if (query.state) {
      params.push(query.state);
      conditions.push(`app_state = $${params.length}`);
    }
    if (query.modality) {
      params.push(query.modality);
      conditions.push(`app_type = $${params.length}`);
    }
    if (query.kind) {
      params.push(query.kind);
      conditions.push(`app_kind = $${params.length}`);
    }
    if (query.psyId) {
      params.push(query.psyId);
      conditions.push(`psy_id = $${params.length}`);
    }

    const whereExtra = conditions.length ? `AND ${conditions.join(' AND ')}` : '';

    const [currentCountRow] = await this.dataSource.query<
      Array<{ total: number }>
    >(
      `
      SELECT COUNT(*)::int AS total
      FROM appointments
      WHERE ${dateCol} >= $1 AND ${dateCol} <= $2
      ${whereExtra}
    `,
      params,
    );

    const prevParams: unknown[] = [
      range.previousStartDate,
      range.previousEndDate,
      ...params.slice(2),
    ];
    const [previousCountRow] = await this.dataSource.query<
      Array<{ total: number }>
    >(
      `
      SELECT COUNT(*)::int AS total
      FROM appointments
      WHERE ${dateCol} >= $1 AND ${dateCol} <= $2
      ${whereExtra}
    `,
      prevParams,
    );

    const totalAppointments = currentCountRow?.total ?? 0;
    const previousTotal = previousCountRow?.total ?? 0;

    const daysCount = Math.max(
      1,
      Math.round(
        (range.endDate.getTime() - range.startDate.getTime()) /
        (1000 * 60 * 60 * 24),
      ),
    );
    const dailyAverage = Number((totalAppointments / daysCount).toFixed(2));

    const byStateRows = await this.dataSource.query<
      Array<{ app_state: string; count: number }>
    >(
      `
      SELECT app_state, COUNT(*)::int AS count
      FROM appointments
      WHERE ${dateCol} >= $1 AND ${dateCol} <= $2
      ${whereExtra}
      GROUP BY app_state
      ORDER BY count DESC
    `,
      params,
    );

    const byState = byStateRows.map((r) => ({
      state: r.app_state,
      count: r.count,
      percentage:
        totalAppointments > 0
          ? Number(((r.count / totalAppointments) * 100).toFixed(2))
          : 0,
    }));

    const byModalityRows = await this.dataSource.query<
      Array<{ app_type: string; count: number }>
    >(
      `
      SELECT app_type, COUNT(*)::int AS count
      FROM appointments
      WHERE ${dateCol} >= $1 AND ${dateCol} <= $2
      ${whereExtra}
      GROUP BY app_type
      ORDER BY count DESC
    `,
      params,
    );

    const byModality = byModalityRows.map((r) => ({
      modality: r.app_type,
      count: r.count,
      percentage:
        totalAppointments > 0
          ? Number(((r.count / totalAppointments) * 100).toFixed(2))
          : 0,
    }));

    const byKindRows = await this.dataSource.query<
      Array<{ app_kind: string; count: number }>
    >(
      `
      SELECT app_kind, COUNT(*)::int AS count
      FROM appointments
      WHERE ${dateCol} >= $1 AND ${dateCol} <= $2
      ${whereExtra}
      GROUP BY app_kind
      ORDER BY count DESC
    `,
      params,
    );

    const byKind = byKindRows.map((r) => ({
      kind: r.app_kind,
      count: r.count,
      percentage:
        totalAppointments > 0
          ? Number(((r.count / totalAppointments) * 100).toFixed(2))
          : 0,
    }));

    const dailyCounts = await this.dataSource.query<
      Array<{ day: string; count: number }>
    >(
      `
      SELECT TO_CHAR(${dateCol}, 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
      FROM appointments
      WHERE ${dateCol} >= $1 AND ${dateCol} <= $2
      ${whereExtra}
      GROUP BY day
      ORDER BY count DESC
    `,
      params,
    );

    const peakDays = {
      highest:
        dailyCounts.length > 0
          ? { day: dailyCounts[0].day, count: dailyCounts[0].count }
          : null,
      lowest:
        dailyCounts.length > 0
          ? {
            day: dailyCounts[dailyCounts.length - 1].day,
            count: dailyCounts[dailyCounts.length - 1].count,
          }
          : null,
    };

    const timelineRows = await this.dataSource.query<
      Array<{
        date: string;
        total: number;
        realizada: number;
        confirmada: number;
        cancelada: number;
        no_asistio: number;
        otros: number;
      }>
    >(
      `
      SELECT
        TO_CHAR(${dateCol}, 'YYYY-MM-DD') AS date,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE app_state = 'realizada')::int AS realizada,
        COUNT(*) FILTER (WHERE app_state = 'confirmada')::int AS confirmada,
        COUNT(*) FILTER (WHERE app_state = 'cancelada')::int AS cancelada,
        COUNT(*) FILTER (WHERE app_state = 'no_asistio')::int AS no_asistio,
        COUNT(*) FILTER (WHERE app_state NOT IN ('realizada', 'confirmada', 'cancelada', 'no_asistio'))::int AS otros
      FROM appointments
      WHERE ${dateCol} >= $1 AND ${dateCol} <= $2
      ${whereExtra}
      GROUP BY date
      ORDER BY date ASC
    `,
      params,
    );

    const recordsRows = await this.dataSource.query<
      Array<{
        app_id: number;
        app_date: Date;
        app_created_at: Date;
        app_state: string;
        app_type: string;
        app_kind: string;
        psychologist_name: string | null;
      }>
    >(
      `
      SELECT
        a.app_id,
        a.app_date,
        a.app_created_at,
        a.app_state,
        a.app_type,
        a.app_kind,
        COALESCE(p.per_name, 'Sin asignar') AS psychologist_name
      FROM appointments a
      LEFT JOIN person p ON p.per_id = a.psy_id
      WHERE ${dateCol} >= $1 AND ${dateCol} <= $2
      ${whereExtra}
      ORDER BY a.${dateCol} DESC
      LIMIT 200
    `,
      params,
    );

    const records = recordsRows.map((r) => ({
      appId: r.app_id,
      scheduledDate: r.app_date.toISOString(),
      createdAt: r.app_created_at.toISOString(),
      state: r.app_state,
      modality: r.app_type,
      kind: r.app_kind,
      psychologistName: r.psychologist_name ?? 'Sin asignar',
    }));

    return {
      period,
      dateBasis:
        dateBasis === AppointmentDateBasis.Created ? 'created' : 'scheduled',
      totalAppointments,
      dailyAverage,
      comparisonWithPrevious: compareMetrics(totalAppointments, previousTotal),
      peakDays,
      byState,
      byModality,
      byKind,
      timeline: timelineRows,
      records,
    };
  }

  /**
   * Report 3: Attendance and No-show Report.
   */
  async getAttendanceReport(
    range: ResolvedDateRange,
    query: AttendanceReportQueryDto,
  ): Promise<AttendanceReport> {
    const period = this.formatPeriod(range);

    const conditions: string[] = ['a.app_date <= NOW()'];
    const params: unknown[] = [range.startDate, range.endDate];

    if (query.psyId) {
      params.push(query.psyId);
      conditions.push(`a.psy_id = $${params.length}`);
    }
    if (query.modality) {
      params.push(query.modality);
      conditions.push(`a.app_type = $${params.length}`);
    }
    if (query.kind) {
      params.push(query.kind);
      conditions.push(`a.app_kind = $${params.length}`);
    }

    const whereExtra = `AND ${conditions.join(' AND ')}`;

    const [currentMetrics] = await this.dataSource.query<
      Array<{
        total_past: number;
        completed: number;
        no_show: number;
        other_past: number;
      }>
    >(
      `
      SELECT
        COUNT(*)::int AS total_past,
        COUNT(*) FILTER (WHERE a.app_state = 'realizada')::int AS completed,
        COUNT(*) FILTER (WHERE a.app_state = 'no_asistio')::int AS no_show,
        COUNT(*) FILTER (WHERE a.app_state NOT IN ('realizada', 'no_asistio'))::int AS other_past
      FROM appointments a
      WHERE a.app_date >= $1 AND a.app_date <= $2
      ${whereExtra}
    `,
      params,
    );

    const prevParams: unknown[] = [
      range.previousStartDate,
      range.previousEndDate,
      ...params.slice(2),
    ];
    const [prevMetrics] = await this.dataSource.query<
      Array<{
        completed: number;
        no_show: number;
      }>
    >(
      `
      SELECT
        COUNT(*) FILTER (WHERE a.app_state = 'realizada')::int AS completed,
        COUNT(*) FILTER (WHERE a.app_state = 'no_asistio')::int AS no_show
      FROM appointments a
      WHERE a.app_date >= $1 AND a.app_date <= $2
      ${whereExtra}
    `,
      prevParams,
    );

    const completed = currentMetrics?.completed ?? 0;
    const noShow = currentMetrics?.no_show ?? 0;
    const evaluated = completed + noShow;
    const attendanceRate =
      evaluated > 0 ? Number(((completed / evaluated) * 100).toFixed(2)) : null;
    const noShowRate =
      evaluated > 0 ? Number(((noShow / evaluated) * 100).toFixed(2)) : null;

    const prevCompleted = prevMetrics?.completed ?? 0;
    const prevNoShow = prevMetrics?.no_show ?? 0;
    const prevEvaluated = prevCompleted + prevNoShow;
    const prevAttendanceRate =
      prevEvaluated > 0
        ? Number(((prevCompleted / prevEvaluated) * 100).toFixed(2))
        : null;

    let rateDifference: number | null = null;
    if (attendanceRate !== null && prevAttendanceRate !== null) {
      rateDifference = Number((attendanceRate - prevAttendanceRate).toFixed(2));
    }

    const monthlyRows = await this.dataSource.query<
      Array<{
        month: string;
        completed: number;
        no_show: number;
      }>
    >(
      `
      SELECT
        TO_CHAR(a.app_date, 'YYYY-MM') AS month,
        COUNT(*) FILTER (WHERE a.app_state = 'realizada')::int AS completed,
        COUNT(*) FILTER (WHERE a.app_state = 'no_asistio')::int AS no_show
      FROM appointments a
      WHERE a.app_date >= $1 AND a.app_date <= $2
      ${whereExtra}
      GROUP BY month
      ORDER BY month ASC
    `,
      params,
    );

    const monthlyEvolution = monthlyRows.map((r) => {
      const evalTotal = r.completed + r.no_show;
      return {
        month: r.month,
        completed: r.completed,
        noShow: r.no_show,
        evaluated: evalTotal,
        attendanceRate:
          evalTotal > 0
            ? Number(((r.completed / evalTotal) * 100).toFixed(2))
            : null,
        noShowRate:
          evalTotal > 0
            ? Number(((r.no_show / evalTotal) * 100).toFixed(2))
            : null,
      };
    });

    const psychologistRows = await this.dataSource.query<
      Array<{
        psy_id: number | null;
        psychologist_name: string;
        completed: number;
        no_show: number;
      }>
    >(
      `
      SELECT
        a.psy_id,
        COALESCE(p.per_name, 'Sin psicólogo asignado') AS psychologist_name,
        COUNT(*) FILTER (WHERE a.app_state = 'realizada')::int AS completed,
        COUNT(*) FILTER (WHERE a.app_state = 'no_asistio')::int AS no_show
      FROM appointments a
      LEFT JOIN person p ON p.per_id = a.psy_id
      WHERE a.app_date >= $1 AND a.app_date <= $2
      ${whereExtra}
      GROUP BY a.psy_id, p.per_name
      ORDER BY (COUNT(*) FILTER (WHERE a.app_state IN ('realizada', 'no_asistio'))) DESC
    `,
      params,
    );

    const byPsychologist = psychologistRows.map((r) => {
      const evalTotal = r.completed + r.no_show;
      return {
        psyId: r.psy_id,
        psychologistName: r.psychologist_name,
        completed: r.completed,
        noShow: r.no_show,
        evaluated: evalTotal,
        attendanceRate:
          evalTotal > 0
            ? Number(((r.completed / evalTotal) * 100).toFixed(2))
            : null,
        noShowRate:
          evalTotal > 0
            ? Number(((r.no_show / evalTotal) * 100).toFixed(2))
            : null,
      };
    });

    const modalityRows = await this.dataSource.query<
      Array<{
        modality: string;
        completed: number;
        no_show: number;
      }>
    >(
      `
      SELECT
        a.app_type AS modality,
        COUNT(*) FILTER (WHERE a.app_state = 'realizada')::int AS completed,
        COUNT(*) FILTER (WHERE a.app_state = 'no_asistio')::int AS no_show
      FROM appointments a
      WHERE a.app_date >= $1 AND a.app_date <= $2
      ${whereExtra}
      GROUP BY a.app_type
      ORDER BY (COUNT(*) FILTER (WHERE a.app_state IN ('realizada', 'no_asistio'))) DESC
    `,
      params,
    );

    const byModality = modalityRows.map((r) => {
      const evalTotal = r.completed + r.no_show;
      return {
        modality: r.modality,
        completed: r.completed,
        noShow: r.no_show,
        evaluated: evalTotal,
        attendanceRate:
          evalTotal > 0
            ? Number(((r.completed / evalTotal) * 100).toFixed(2))
            : null,
        noShowRate:
          evalTotal > 0
            ? Number(((r.no_show / evalTotal) * 100).toFixed(2))
            : null,
      };
    });

    const kindRows = await this.dataSource.query<
      Array<{
        kind: string;
        completed: number;
        no_show: number;
      }>
    >(
      `
      SELECT
        a.app_kind AS kind,
        COUNT(*) FILTER (WHERE a.app_state = 'realizada')::int AS completed,
        COUNT(*) FILTER (WHERE a.app_state = 'no_asistio')::int AS no_show
      FROM appointments a
      WHERE a.app_date >= $1 AND a.app_date <= $2
      ${whereExtra}
      GROUP BY a.app_kind
      ORDER BY (COUNT(*) FILTER (WHERE a.app_state IN ('realizada', 'no_asistio'))) DESC
    `,
      params,
    );

    const byKind = kindRows.map((r) => {
      const evalTotal = r.completed + r.no_show;
      return {
        kind: r.kind,
        completed: r.completed,
        noShow: r.no_show,
        evaluated: evalTotal,
        attendanceRate:
          evalTotal > 0
            ? Number(((r.completed / evalTotal) * 100).toFixed(2))
            : null,
        noShowRate:
          evalTotal > 0
            ? Number(((r.no_show / evalTotal) * 100).toFixed(2))
            : null,
      };
    });

    return {
      period,
      metrics: {
        totalPastAppointments: currentMetrics?.total_past ?? 0,
        completedAppointments: completed,
        noShowAppointments: noShow,
        otherPastAppointments: currentMetrics?.other_past ?? 0,
        evaluatedAppointments: evaluated,
        attendanceRate,
        noShowRate,
        comparisonWithPreviousAttendanceRate: {
          currentRate: attendanceRate,
          previousRate: prevAttendanceRate,
          difference: rateDifference,
        },
      },
      monthlyEvolution,
      byPsychologist,
      byModality,
      byKind,
    };
  }

  /**
   * Report 4: Donations History and Transaction Status Report.
   */
  async getDonationsHistoryReport(
    range: ResolvedDateRange,
    query: DonationsHistoryQueryDto,
  ): Promise<DonationsHistoryReport> {
    const period = this.formatPeriod(range);

    const conditions: string[] = [];
    const params: unknown[] = [range.startDate, range.endDate];

    if (query.status) {
      params.push(query.status.toUpperCase());
      conditions.push(`don_status = $${params.length}`);
    }
    if (query.paymentMethod) {
      params.push(query.paymentMethod.toUpperCase());
      conditions.push(`UPPER(don_payment_method_type) = $${params.length}`);
    }

    const whereExtra = conditions.length ? `AND ${conditions.join(' AND ')}` : '';

    const [summaryRow] = await this.dataSource.query<
      Array<{
        total_transactions: number;
        confirmed_count: number;
        confirmed_amount: string;
        pending_count: number;
        pending_amount: string;
        declined_count: number;
        declined_amount: string;
      }>
    >(
      `
      SELECT
        COUNT(*)::int AS total_transactions,
        COUNT(*) FILTER (WHERE don_status = 'APPROVED')::int AS confirmed_count,
        COALESCE(SUM(don_amount_in_cents) FILTER (WHERE don_status = 'APPROVED'), 0)::text AS confirmed_amount,
        COUNT(*) FILTER (WHERE don_status = 'PENDING')::int AS pending_count,
        COALESCE(SUM(don_amount_in_cents) FILTER (WHERE don_status = 'PENDING'), 0)::text AS pending_amount,
        COUNT(*) FILTER (WHERE don_status IN ('DECLINED', 'VOIDED', 'ERROR'))::int AS declined_count,
        COALESCE(SUM(don_amount_in_cents) FILTER (WHERE don_status IN ('DECLINED', 'VOIDED', 'ERROR')), 0)::text AS declined_amount
      FROM donation
      WHERE don_created_at >= $1 AND don_created_at <= $2
      ${whereExtra}
    `,
      params,
    );

    const totalTransactions = summaryRow?.total_transactions ?? 0;
    const confirmedCount = summaryRow?.confirmed_count ?? 0;
    const confirmedAmount = BigInt(summaryRow?.confirmed_amount ?? '0');
    const averageConfirmedAmountInCents =
      confirmedCount > 0
        ? (confirmedAmount / BigInt(confirmedCount)).toString()
        : '0';

    const byStatusRows = await this.dataSource.query<
      Array<{ status: string; count: number; amount: string }>
    >(
      `
      SELECT
        don_status AS status,
        COUNT(*)::int AS count,
        COALESCE(SUM(don_amount_in_cents), 0)::text AS amount
      FROM donation
      WHERE don_created_at >= $1 AND don_created_at <= $2
      ${whereExtra}
      GROUP BY don_status
      ORDER BY count DESC
    `,
      params,
    );

    const byStatus = byStatusRows.map((r) => ({
      status: r.status,
      count: r.count,
      amountInCents: r.amount,
      percentage:
        totalTransactions > 0
          ? Number(((r.count / totalTransactions) * 100).toFixed(2))
          : 0,
    }));

    const byPaymentMethodRows = await this.dataSource.query<
      Array<{
        payment_method: string;
        count: number;
        confirmed_count: number;
        confirmed_amount: string;
      }>
    >(
      `
      SELECT
        COALESCE(don_payment_method_type, 'Sin especificar') AS payment_method,
        COUNT(*)::int AS count,
        COUNT(*) FILTER (WHERE don_status = 'APPROVED')::int AS confirmed_count,
        COALESCE(SUM(don_amount_in_cents) FILTER (WHERE don_status = 'APPROVED'), 0)::text AS confirmed_amount
      FROM donation
      WHERE don_created_at >= $1 AND don_created_at <= $2
      ${whereExtra}
      GROUP BY don_payment_method_type
      ORDER BY count DESC
    `,
      params,
    );

    const byPaymentMethod = byPaymentMethodRows.map((r) => ({
      paymentMethod: r.payment_method,
      count: r.count,
      confirmedCount: r.confirmed_count,
      confirmedAmountInCents: r.confirmed_amount,
      percentage:
        totalTransactions > 0
          ? Number(((r.count / totalTransactions) * 100).toFixed(2))
          : 0,
    }));

    const transactionRows = await this.dataSource.query<
      Array<{
        don_id: number;
        don_wompi_transaction_id: string;
        don_reference: string;
        don_amount_in_cents: string;
        don_currency: string;
        don_status: string;
        don_payment_method_type: string | null;
        don_donor_full_name: string | null;
        don_donor_email: string | null;
        don_created_at: Date;
      }>
    >(
      `
      SELECT
        don_id,
        don_wompi_transaction_id,
        don_reference,
        don_amount_in_cents::text,
        don_currency,
        don_status,
        don_payment_method_type,
        don_donor_full_name,
        don_donor_email,
        don_created_at
      FROM donation
      WHERE don_created_at >= $1 AND don_created_at <= $2
      ${whereExtra}
      ORDER BY don_created_at DESC
      LIMIT 200
    `,
      params,
    );

    const transactions = transactionRows.map((r) => ({
      donId: r.don_id,
      wompiTransactionId: r.don_wompi_transaction_id,
      reference: r.don_reference,
      amountInCents: r.don_amount_in_cents,
      currency: r.don_currency,
      status: r.don_status,
      paymentMethodType: r.don_payment_method_type,
      donorFullName: r.don_donor_full_name,
      donorEmailMasked: maskEmail(r.don_donor_email),
      createdAt: r.don_created_at.toISOString(),
    }));

    return {
      period,
      summary: {
        totalTransactions,
        confirmedCount,
        confirmedAmountInCents: confirmedAmount.toString(),
        pendingCount: summaryRow?.pending_count ?? 0,
        pendingAmountInCents: summaryRow?.pending_amount ?? '0',
        declinedCount: summaryRow?.declined_count ?? 0,
        declinedAmountInCents: summaryRow?.declined_amount ?? '0',
        averageConfirmedAmountInCents,
        currency: 'COP',
      },
      byStatus,
      byPaymentMethod,
      transactions,
    };
  }

  /**
   * Report 5: Behavior and Evolution of Contributions Report.
   */
  async getDonationsEvolutionReport(
    range: ResolvedDateRange,
    query: DonationsEvolutionQueryDto,
  ): Promise<DonationsEvolutionReport> {
    const period = this.formatPeriod(range);

    const conditions: string[] = ["don_status = 'APPROVED'"];
    const params: unknown[] = [range.startDate, range.endDate];

    if (query.paymentMethod) {
      params.push(query.paymentMethod.toUpperCase());
      conditions.push(`UPPER(don_payment_method_type) = $${params.length}`);
    }

    const whereExtra = `AND ${conditions.join(' AND ')}`;

    const [currentSummary] = await this.dataSource.query<
      Array<{
        confirmed_count: number;
        total_amount: string;
        average_amount: string;
        highest_amount: string | null;
        lowest_amount: string | null;
      }>
    >(
      `
      SELECT
        COUNT(*)::int AS confirmed_count,
        COALESCE(SUM(don_amount_in_cents), 0)::text AS total_amount,
        COALESCE(AVG(don_amount_in_cents)::bigint, 0)::text AS average_amount,
        MAX(don_amount_in_cents)::text AS highest_amount,
        MIN(don_amount_in_cents)::text AS lowest_amount
      FROM donation
      WHERE don_created_at >= $1 AND don_created_at <= $2
      ${whereExtra}
    `,
      params,
    );

    const prevParams: unknown[] = [
      range.previousStartDate,
      range.previousEndDate,
      ...params.slice(2),
    ];
    const [prevSummary] = await this.dataSource.query<
      Array<{
        confirmed_count: number;
        total_amount: string;
      }>
    >(
      `
      SELECT
        COUNT(*)::int AS confirmed_count,
        COALESCE(SUM(don_amount_in_cents), 0)::text AS total_amount
      FROM donation
      WHERE don_created_at >= $1 AND don_created_at <= $2
      ${whereExtra}
    `,
      prevParams,
    );

    const confirmedCount = currentSummary?.confirmed_count ?? 0;
    const totalAmount = BigInt(currentSummary?.total_amount ?? '0');
    const prevConfirmedCount = prevSummary?.confirmed_count ?? 0;
    const prevTotalAmount = BigInt(prevSummary?.total_amount ?? '0');

    const diffAmount = totalAmount - prevTotalAmount;
    let percentageVariation: number | null = null;
    if (prevTotalAmount > 0n) {
      percentageVariation = Number(
        ((Number(diffAmount) / Number(prevTotalAmount)) * 100).toFixed(2),
      );
    } else if (totalAmount === 0n && prevTotalAmount === 0n) {
      percentageVariation = 0;
    }

    const valueRangeRows = await this.dataSource.query<
      Array<{
        range_label: string;
        count: number;
        total_amount: string;
      }>
    >(
      `
      SELECT
        CASE
          WHEN don_amount_in_cents < 2000000 THEN 'Menos de $20.000'
          WHEN don_amount_in_cents >= 2000000 AND don_amount_in_cents < 5000000 THEN '$20.000 a $50.000'
          WHEN don_amount_in_cents >= 5000000 AND don_amount_in_cents < 10000000 THEN '$50.000 a $100.000'
          WHEN don_amount_in_cents >= 10000000 AND don_amount_in_cents <= 50000000 THEN '$100.000 a $500.000'
          ELSE 'Más de $500.000'
        END AS range_label,
        COUNT(*)::int AS count,
        COALESCE(SUM(don_amount_in_cents), 0)::text AS total_amount
      FROM donation
      WHERE don_created_at >= $1 AND don_created_at <= $2
      ${whereExtra}
      GROUP BY range_label
      ORDER BY MIN(don_amount_in_cents) ASC
    `,
      params,
    );

    const valueRanges = valueRangeRows.map((r) => ({
      rangeLabel: r.range_label,
      count: r.count,
      totalAmountInCents: r.total_amount,
      percentageOfTotal:
        confirmedCount > 0
          ? Number(((r.count / confirmedCount) * 100).toFixed(2))
          : 0,
    }));

    const timelineRows = await this.dataSource.query<
      Array<{
        date: string;
        count: number;
        amount: string;
      }>
    >(
      `
      SELECT
        TO_CHAR(don_created_at, 'YYYY-MM-DD') AS date,
        COUNT(*)::int AS count,
        COALESCE(SUM(don_amount_in_cents), 0)::text AS amount
      FROM donation
      WHERE don_created_at >= $1 AND don_created_at <= $2
      ${whereExtra}
      GROUP BY date
      ORDER BY date ASC
    `,
      params,
    );

    const timeline = timelineRows.map((r) => ({
      date: r.date,
      count: r.count,
      amountInCents: r.amount,
    }));

    return {
      period,
      summary: {
        confirmedCount,
        totalAmountInCents: totalAmount.toString(),
        averageAmountInCents: currentSummary?.average_amount ?? '0',
        highestAmountInCents: currentSummary?.highest_amount ?? null,
        lowestAmountInCents: currentSummary?.lowest_amount ?? null,
        currency: 'COP',
      },
      comparisonWithPrevious: {
        currentAmountInCents: totalAmount.toString(),
        previousAmountInCents: prevTotalAmount.toString(),
        differenceInCents: diffAmount.toString(),
        percentageVariation,
        countComparison: compareMetrics(confirmedCount, prevConfirmedCount),
      },
      valueRanges,
      timeline,
    };
  }
}

import type { MetricComparison } from './reports-date.util.js';

export interface ReportPeriodMetadata {
  startDate: string;
  endDate: string;
  previousStartDate: string;
  previousEndDate: string;
  preset?: string;
  periodLabel: string;
  generatedAt: string;
}

/**
 * Report 1: Reporte General de Gestión de la Fundación
 */
export interface GeneralManagementReport {
  period: ReportPeriodMetadata;
  appointments: {
    total: number;
    completed: number;
    scheduled: number;
    cancelled: number;
    noShow: number;
    comparisonWithPrevious: MetricComparison;
  };
  users: {
    totalRegistered: number;
    newRegistered: number;
    comparisonWithPrevious: MetricComparison;
  };
  donations: {
    confirmedDonationsCount: number;
    totalAmountInCents: string;
    currency: string;
    countComparison: MetricComparison;
    amountComparison: {
      currentAmountInCents: string;
      previousAmountInCents: string;
      differenceInCents: string;
      percentage: number | null;
    };
  };
  timeline: Array<{
    date: string;
    appointmentsCount: number;
    completedAppointmentsCount: number;
    donationsCount: number;
    donationsAmountInCents: string;
  }>;
}

/**
 * Report 2: Reporte de Gestión y Evolución de Citas
 */
export interface AppointmentsEvolutionReport {
  period: ReportPeriodMetadata;
  dateBasis: 'scheduled' | 'created';
  totalAppointments: number;
  dailyAverage: number;
  comparisonWithPrevious: MetricComparison;
  peakDays: {
    highest: { day: string; count: number } | null;
    lowest: { day: string; count: number } | null;
  };
  byState: Array<{
    state: string;
    count: number;
    percentage: number;
  }>;
  byModality: Array<{
    modality: string;
    count: number;
    percentage: number;
  }>;
  byKind: Array<{
    kind: string;
    count: number;
    percentage: number;
  }>;
  timeline: Array<{
    date: string;
    total: number;
    realizada: number;
    confirmada: number;
    cancelada: number;
    no_asistio: number;
    otros: number;
  }>;
  records: Array<{
    appId: number;
    scheduledDate: string;
    createdAt: string;
    state: string;
    modality: string;
    kind: string;
    psychologistName: string;
  }>;
}

/**
 * Report 3: Reporte de Asistencia e Inasistencia
 */
export interface AttendanceReport {
  period: ReportPeriodMetadata;
  metrics: {
    totalPastAppointments: number;
    completedAppointments: number;
    noShowAppointments: number;
    otherPastAppointments: number;
    evaluatedAppointments: number;
    attendanceRate: number | null;
    noShowRate: number | null;
    comparisonWithPreviousAttendanceRate: {
      currentRate: number | null;
      previousRate: number | null;
      difference: number | null;
    };
  };
  monthlyEvolution: Array<{
    month: string;
    completed: number;
    noShow: number;
    evaluated: number;
    attendanceRate: number | null;
    noShowRate: number | null;
  }>;
  byPsychologist: Array<{
    psyId: number | null;
    psychologistName: string;
    completed: number;
    noShow: number;
    evaluated: number;
    attendanceRate: number | null;
    noShowRate: number | null;
  }>;
  byModality: Array<{
    modality: string;
    completed: number;
    noShow: number;
    evaluated: number;
    attendanceRate: number | null;
    noShowRate: number | null;
  }>;
  byKind: Array<{
    kind: string;
    completed: number;
    noShow: number;
    evaluated: number;
    attendanceRate: number | null;
    noShowRate: number | null;
  }>;
}

/**
 * Report 4: Reporte de Historial y Estado de las Donaciones
 */
export interface DonationsHistoryReport {
  period: ReportPeriodMetadata;
  summary: {
    totalTransactions: number;
    confirmedCount: number;
    confirmedAmountInCents: string;
    pendingCount: number;
    pendingAmountInCents: string;
    declinedCount: number;
    declinedAmountInCents: string;
    averageConfirmedAmountInCents: string;
    currency: string;
  };
  byStatus: Array<{
    status: string;
    count: number;
    amountInCents: string;
    percentage: number;
  }>;
  byPaymentMethod: Array<{
    paymentMethod: string;
    count: number;
    confirmedCount: number;
    confirmedAmountInCents: string;
    percentage: number;
  }>;
  transactions: Array<{
    donId: number;
    wompiTransactionId: string;
    reference: string;
    amountInCents: string;
    currency: string;
    status: string;
    paymentMethodType: string | null;
    donorFullName: string | null;
    donorEmailMasked: string | null;
    createdAt: string;
  }>;
}

/**
 * Report 5: Reporte de Comportamiento y Evolución de los Aportes
 */
export interface DonationsEvolutionReport {
  period: ReportPeriodMetadata;
  summary: {
    confirmedCount: number;
    totalAmountInCents: string;
    averageAmountInCents: string;
    highestAmountInCents: string | null;
    lowestAmountInCents: string | null;
    currency: string;
  };
  comparisonWithPrevious: {
    currentAmountInCents: string;
    previousAmountInCents: string;
    differenceInCents: string;
    percentageVariation: number | null;
    countComparison: MetricComparison;
  };
  valueRanges: Array<{
    rangeLabel: string;
    count: number;
    totalAmountInCents: string;
    percentageOfTotal: number;
  }>;
  timeline: Array<{
    date: string;
    count: number;
    amountInCents: string;
  }>;
}

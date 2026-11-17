/** Supported date-range presets for administrator reports. */
export type ReportPreset =
  | "today"
  | "last_7_days"
  | "last_month"
  | "last_3_months"
  | "current_year"
  | "custom";

/** Shared date range and report-specific query filters. */
export type ReportQuery = {
  preset: ReportPreset;
  startDate?: string;
  endDate?: string;
  dateBasis?: "scheduled" | "created";
  state?: string;
  modality?: string;
  kind?: string;
  psyId?: number;
  status?: string;
  paymentMethod?: string;
};

/** Current and previous report periods with generation metadata. */
export type ReportPeriod = {
  startDate: string;
  endDate: string;
  previousStartDate: string;
  previousEndDate: string;
  preset?: string;
  periodLabel: string;
  generatedAt: string;
};

/** Current-versus-previous values and their change. */
export type MetricComparison = {
  current: number;
  previous: number;
  difference: number;
  percentage: number | null;
};

/** General dashboard totals and daily activity timeline. */
export type GeneralManagementReport = {
  period: ReportPeriod;
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
  timeline: {
    date: string;
    appointmentsCount: number;
    completedAppointmentsCount: number;
    donationsCount: number;
    donationsAmountInCents: string;
  }[];
};

/** Appointment counts grouped by the selected date basis and filters. */
export type AppointmentsEvolutionReport = {
  period: ReportPeriod;
  /** Whether appointments are grouped by scheduled or request date. */
  dateBasis: "scheduled" | "created";
  totalAppointments: number;
  /** Mean matching appointments per calendar day in the report period. */
  dailyAverage: number;
  comparisonWithPrevious: MetricComparison;
  peakDays: {
    highest: { day: string; count: number } | null;
    lowest: { day: string; count: number } | null;
  };
  byState: { state: string; count: number; percentage: number }[];
  byModality: { modality: string; count: number; percentage: number }[];
  byKind: { kind: string; count: number; percentage: number }[];
  timeline: {
    date: string;
    total: number;
    realizada: number;
    confirmada: number;
    cancelada: number;
    no_asistio: number;
    otros: number;
  }[];
  records: {
    appId: number;
    scheduledDate: string | null;
    createdAt: string;
    state: string;
    modality: string;
    kind: string;
    psychologistName: string;
  }[];
};

/** Attendance rates and counts for completed and no-show appointments. */
export type AttendanceReport = {
  period: ReportPeriod;
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
  monthlyEvolution: {
    month: string;
    completed: number;
    noShow: number;
    evaluated: number;
    attendanceRate: number | null;
    noShowRate: number | null;
  }[];
  byPsychologist: {
    psyId: number | null;
    psychologistName: string;
    completed: number;
    noShow: number;
    evaluated: number;
    attendanceRate: number | null;
    noShowRate: number | null;
  }[];
  byModality: {
    modality: string;
    completed: number;
    noShow: number;
    evaluated: number;
    attendanceRate: number | null;
    noShowRate: number | null;
  }[];
  byKind: {
    kind: string;
    completed: number;
    noShow: number;
    evaluated: number;
    attendanceRate: number | null;
    noShowRate: number | null;
  }[];
};

/** Donation history aggregates and transaction details. */
export type DonationsHistoryReport = {
  period: ReportPeriod;
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
  byStatus: {
    status: string;
    count: number;
    amountInCents: string;
    percentage: number;
  }[];
  byPaymentMethod: {
    paymentMethod: string;
    count: number;
    confirmedCount: number;
    confirmedAmountInCents: string;
    percentage: number;
  }[];
  transactions: {
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
  }[];
};

/** Confirmed donation totals, comparisons, ranges, and daily timeline. */
export type DonationsEvolutionReport = {
  period: ReportPeriod;
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
  valueRanges: {
    rangeLabel: string;
    count: number;
    totalAmountInCents: string;
    percentageOfTotal: number;
  }[];
  timeline: { date: string; count: number; amountInCents: string }[];
};

/** Discriminated response union for all administrator report endpoints. */
export type ReportResponse =
  | { kind: "general"; data: GeneralManagementReport }
  | { kind: "appointments"; data: AppointmentsEvolutionReport }
  | { kind: "attendance"; data: AttendanceReport }
  | { kind: "donations-history"; data: DonationsHistoryReport }
  | { kind: "donations-evolution"; data: DonationsEvolutionReport };

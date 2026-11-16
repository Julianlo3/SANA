/**
 * Supported date range presets for administrative reports.
 */
export enum ReportPreset {
  Today = 'today',
  Last7Days = 'last_7_days',
  LastMonth = 'last_month',
  Last3Months = 'last_3_months',
  CurrentYear = 'current_year',
  Custom = 'custom',
}

/**
 * Filter criteria for date basis in appointment reports.
 */
export enum AppointmentDateBasis {
  Scheduled = 'scheduled',
  Created = 'created',
}

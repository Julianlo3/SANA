/**
 * Aggregate metrics returned by the administrator reports endpoint.
 */
export type ReportsSummary = {
  /** Aggregate completed appointments and active psychologist metrics. */
  psychology: {
    /** Total appointments with completed status. */
    totalCompletedAppointments: number;
    /** Mean completed appointments across active psychologists. */
    averageCompletedAppointmentsPerPsychologist: number;
    /** Number of active psychologist accounts. */
    activePsychologists: number;
  };
  /** Aggregate consultant activity metrics. */
  system: {
    /** Number of active consultant accounts. */
    totalConsultants: number;
    /** Mean appointments per consultant. */
    averageAppointmentsPerConsultant: number;
  };
  /** Aggregate approved donation metrics. */
  donations: {
    /** Approved donation sum in centavos, represented as an integer string. */
    totalAmountInCents: string;
    /** Number of approved donation transactions. */
    approvedDonations: number;
    /** Number of distinct people with approved donations. */
    peopleWhoDonated: number;
  };
};

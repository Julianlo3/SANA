import type { DonationsHistoryReport } from "../types/report-types";

/** Period boundaries used to filter donor transactions. */
type TrendPeriod = Pick<DonationsHistoryReport["period"], "startDate" | "endDate">;

/** Select value and display label for a donor filter. */
export type DonorFilterOption = {
  value: string;
  label: string;
};

/** Donor display label and exact total in cents. */
export type DonorAmount = {
  label: string;
  amountInCents: string;
};

/** Optional donor selection for summary aggregation. */
type DonorSummaryOptions = {
  donorKey?: string;
};

/** Accumulated donation activity for a normalized donor identity. */
type DonorActivity = {
  key: string;
  label: string;
  totalAmountInCents: bigint;
};

/**
 * Converts a timestamp to its Bogotá calendar date.
 * @param value Timestamp to convert.
 * @returns YYYY-MM-DD date or null for invalid input.
 */
function getBogotaDate(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  const year = values.get("year");
  const month = values.get("month");
  const day = values.get("day");
  return year && month && day ? `${year}-${month}-${day}` : null;
}

/**
 * Normalizes a report boundary to a Bogotá calendar date.
 * @param value ISO date or timestamp boundary.
 * @returns YYYY-MM-DD date or null for invalid input.
 */
function getPeriodDate(value: string): string | null {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : getBogotaDate(value);
}

/**
 * Resolves a transaction's stable donor key and display label.
 * @param transaction Donation transaction.
 * @returns Donor identity, grouping unidentified donors as anonymous.
 */
function getDonorIdentity(
  transaction: DonationsHistoryReport["transactions"][number],
): { key: string; label: string } {
  const name = transaction.donorFullName?.trim() ?? "";
  const email = transaction.donorEmailMasked?.trim() ?? "";
  const normalizedName = name.toLocaleLowerCase("es-CO");
  const normalizedEmail = email.toLocaleLowerCase("es-CO");

  if (!normalizedName && !normalizedEmail) {
    return { key: "anonymous", label: "Anónimo" };
  }
  if (normalizedEmail) {
    return {
      key: `identity:${normalizedName}|${normalizedEmail}`,
      label: name ? `${name} · ${email}` : email,
    };
  }
  if (normalizedName) {
    return { key: `name:${normalizedName}`, label: name };
  }

  return { key: "anonymous", label: "Anónimo" };
}

/**
 * Aggregates approved in-period donations by donor.
 * @param transactions Transactions returned by the history report.
 * @param period Date boundaries used for the aggregation.
 * @param options Optional donor filter.
 * @returns Donor totals, showing the top three and an optional remainder.
 */
export function buildDonorDonationSummary(
  transactions: DonationsHistoryReport["transactions"],
  period: TrendPeriod,
  options: DonorSummaryOptions = {},
): { donors: DonorAmount[]; donorCount: number } {
  const startDate = getPeriodDate(period.startDate);
  const endDate = getPeriodDate(period.endDate);
  const donors = new Map<string, DonorActivity>();
  if (!startDate || !endDate || startDate > endDate) {
    return { donors: [], donorCount: 0 };
  }

  for (const transaction of transactions) {
    if (transaction.status.toUpperCase() !== "APPROVED") continue;

    const date = getBogotaDate(transaction.createdAt);
    if (!date || date < startDate || date > endDate) continue;

    const donor = getDonorIdentity(transaction);
    if (options.donorKey && donor.key !== options.donorKey) continue;

    const activity = donors.get(donor.key) ?? {
      key: donor.key,
      label: donor.label,
      totalAmountInCents: BigInt(0),
    };
    activity.totalAmountInCents += BigInt(transaction.amountInCents);
    donors.set(donor.key, activity);
  }

  const rankedDonors = [...donors.values()].sort((left, right) => {
    if (left.totalAmountInCents !== right.totalAmountInCents) {
      return left.totalAmountInCents > right.totalAmountInCents ? -1 : 1;
    }
    return left.label.localeCompare(right.label, "es-CO");
  });
  const visibleDonors = options.donorKey
    ? rankedDonors
    : rankedDonors.slice(0, 3);
  const otherDonors = options.donorKey ? [] : rankedDonors.slice(3);
  const donorAmounts = visibleDonors.map((donor) => ({
    label: donor.label,
    amountInCents: donor.totalAmountInCents.toString(),
  }));

  if (otherDonors.length) {
    const otherAmount = otherDonors.reduce(
      (total, donor) => total + donor.totalAmountInCents,
      BigInt(0),
    );
    donorAmounts.push({
      label: `Otros donantes (${otherDonors.length})`,
      amountInCents: otherAmount.toString(),
    });
  }

  return { donors: donorAmounts, donorCount: rankedDonors.length };
}

/**
 * Builds unique donor options from approved transactions.
 * @param transactions Transactions returned by the history report.
 * @returns Alphabetically sorted donor filter options.
 */
export function getDonorFilterOptions(
  transactions: DonationsHistoryReport["transactions"],
): DonorFilterOption[] {
  const options = new Map<string, DonorFilterOption>();
  for (const transaction of transactions) {
    if (transaction.status.toUpperCase() !== "APPROVED") continue;

    const donor = getDonorIdentity(transaction);
    options.set(donor.key, { value: donor.key, label: donor.label });
  }

  return [...options.values()].sort((left, right) =>
    left.label.localeCompare(right.label, "es-CO"),
  );
}

import { describe, expect, it } from "vitest";
import { buildMonthlyDonationTrend } from "@/features/reports/lib/donation-monthly-trend";
import type { DonationsEvolutionReport } from "@/features/reports/types/report-types";

describe("monthly donation trend", () => {
  it("sums daily amounts by month and fills months without donations", () => {
    const timeline: DonationsEvolutionReport["timeline"] = [
      { date: "2026-10-20", count: 2, amountInCents: "30000" },
      { date: "2026-12-01", count: 1, amountInCents: "5000" },
    ];

    const result = buildMonthlyDonationTrend(timeline, {
      startDate: "2026-10-17T05:00:00.000Z",
      endDate: "2026-12-01T04:59:59.999Z",
    });

    expect(result).toEqual({
      labels: ["2026-10", "2026-11"],
      values: [30000, 0],
      hasDonations: true,
    });
  });

  it("reports when a selected period has no confirmed amount", () => {
    const result = buildMonthlyDonationTrend([], {
      startDate: "2026-11-01",
      endDate: "2026-11-30",
    });

    expect(result).toEqual({
      labels: ["2026-11"],
      values: [0],
      hasDonations: false,
    });
  });
});

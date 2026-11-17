import { describe, expect, it } from "vitest";
import {
  buildDonorDonationSummary,
  getDonorFilterOptions,
} from "@/features/reports/lib/donation-donor-summary";
import type { DonationsHistoryReport } from "@/features/reports/types/report-types";

function transaction(
  donId: number,
  donorFullName: string | null,
  donorEmailMasked: string | null,
  amountInCents: string,
  createdAt: string,
  status = "APPROVED",
): DonationsHistoryReport["transactions"][number] {
  return {
    donId,
    wompiTransactionId: `transaction-${donId}`,
    reference: `reference-${donId}`,
    amountInCents,
    currency: "COP",
    status,
    paymentMethodType: "NEQUI",
    donorFullName,
    donorEmailMasked,
    createdAt,
  };
}

describe("donor donation summary", () => {
  it("sums confirmed donations by donor within the selected period", () => {
    const result = buildDonorDonationSummary(
      [
        transaction(
          1,
          "Ana",
          "a***@example.com",
          "10000",
          "2026-11-16T05:30:00.000Z",
        ),
        transaction(
          2,
          "Ana",
          "a***@example.com",
          "25000",
          "2026-11-17T05:30:00.000Z",
        ),
        transaction(
          3,
          "Luis",
          "l***@example.com",
          "5000",
          "2026-11-16T16:30:00.000Z",
        ),
        transaction(
          4,
          "Ana",
          "a***@example.com",
          "50000",
          "2026-11-16T05:30:00.000Z",
          "PENDING",
        ),
        transaction(
          5,
          "Out of range",
          null,
          "90000",
          "2026-11-20T12:00:00.000Z",
        ),
      ],
      { startDate: "2026-11-15", endDate: "2026-11-18" },
    );

    expect(result.donors).toEqual([
      { label: "Ana · a***@example.com", amountInCents: "35000" },
      { label: "Luis · l***@example.com", amountInCents: "5000" },
    ]);
  });

  it("shows three donors and groups the rest, including anonymous donors", () => {
    const result = buildDonorDonationSummary(
      [
        transaction(1, "Ana", null, "900", "2026-11-16T12:00:00.000Z"),
        transaction(2, "Luis", null, "800", "2026-11-16T12:00:00.000Z"),
        transaction(3, "Sol", null, "700", "2026-11-16T12:00:00.000Z"),
        transaction(4, "Eva", null, "600", "2026-11-16T12:00:00.000Z"),
        transaction(5, null, null, "500", "2026-11-16T12:00:00.000Z"),
      ],
      { startDate: "2026-11-16", endDate: "2026-11-16" },
    );

    expect(result.donorCount).toBe(5);
    expect(result.donors).toEqual([
      { label: "Ana", amountInCents: "900" },
      { label: "Luis", amountInCents: "800" },
      { label: "Sol", amountInCents: "700" },
      { label: "Otros donantes (2)", amountInCents: "1100" },
    ]);
  });

  it("treats anonymous transactions from different sources as one profile", () => {
    const transactions = [
      transaction(1, null, null, "1000", "2026-11-16T12:00:00.000Z"),
      {
        ...transaction(2, null, null, "2000", "2026-11-16T12:00:00.000Z"),
        paymentMethodType: "PSE",
      },
      transaction(
        3,
        "Pending",
        "p***@example.com",
        "9000",
        "2026-11-16T12:00:00.000Z",
        "PENDING",
      ),
    ];
    const period = {
      startDate: "2026-11-16",
      endDate: "2026-11-16",
    };

    expect(buildDonorDonationSummary(transactions, period).donors).toEqual([
      { label: "Anónimo", amountInCents: "3000" },
    ]);
    expect(getDonorFilterOptions(transactions)).toEqual([
      { value: "anonymous", label: "Anónimo" },
    ]);
  });

  it("shows the selected donor without applying the top-three limit", () => {
    const transactions = [
      transaction(1, "Ana", "a***@example.com", "1000", "2026-11-16T12:00:00.000Z"),
      transaction(2, "Luis", "l***@example.com", "2000", "2026-11-16T12:00:00.000Z"),
      transaction(
        3,
        "Pending",
        "p***@example.com",
        "3000",
        "2026-11-16T12:00:00.000Z",
        "PENDING",
      ),
    ];
    const donorOptions = getDonorFilterOptions(transactions);
    const ana = donorOptions.find((option) => option.label.startsWith("Ana"));
    expect(ana).toBeDefined();
    const result = buildDonorDonationSummary(
      transactions,
      { startDate: "2026-11-16", endDate: "2026-11-16" },
      { donorKey: ana?.value },
    );

    expect(result.donors).toEqual([
      {
        label: "Ana · a***@example.com",
        amountInCents: "1000",
      },
    ]);
    expect(donorOptions).toEqual([
      {
        value: "identity:ana|a***@example.com",
        label: "Ana · a***@example.com",
      },
      {
        value: "identity:luis|l***@example.com",
        label: "Luis · l***@example.com",
      },
    ]);
  });
});

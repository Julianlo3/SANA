import { describe, expect, it } from "vitest";
import {
  formatDateLabel,
  formatMoney,
  formatPercent,
  formatNumberWithTwoDecimals,
  formatSignedPercent,
  humanizeToken,
} from "@/features/reports/lib/report-format";

describe("report formatting", () => {
  it("rounds centavos into Colombian currency without losing large integer precision", () => {
    expect(formatMoney("250049")).toContain("2.500");
    expect(formatMoney("250050")).toContain("2.501");
    expect(formatMoney("900719925474099300")).toContain(
      "9.007.199.254.740.993",
    );
  });

  it("does not present unavailable comparisons as zero", () => {
    expect(formatPercent(null)).toBe("—");
    expect(formatSignedPercent(null)).toBe("Sin comparación disponible");
    expect(formatSignedPercent(-12.5)).toContain("-12,5%");
  });

  it("preserves two decimal places for daily averages", () => {
    expect(formatNumberWithTwoDecimals(0.2)).toBe("0,20");
    expect(formatNumberWithTwoDecimals(0.03)).toBe("0,03");
  });

  it("formats calendar dates without shifting them to another day", () => {
    expect(formatDateLabel("2026-11-16")).toContain("16");
    expect(formatDateLabel("2026-11")).toContain("nov");
    expect(humanizeToken("no_asistio")).toBe("No asistió");
  });
});

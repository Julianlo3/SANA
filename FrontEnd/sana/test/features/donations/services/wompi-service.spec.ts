import { describe, expect, it } from "vitest";
import {
  calculateWompiFee,
  MAX_DONATION_COP,
} from "../../../../src/features/donations/services/wompi-service";

describe("calculateWompiFee", () => {
  it("breaks down the public aggregator fee and IVA for a donation", () => {
    const result = calculateWompiFee(20_000);

    expect(result.percentageFeeAmount).toBe(530);
    expect(result.fixedFeeAmount).toBe(700);
    expect(result.ivaAmount).toBe(234);
    expect(result.feeAmount).toBe(1_464);
    expect(result.netReceivedIfNotCovered).toBe(18_536);
  });

  it("grosses up the checkout total so the foundation receives the intended donation", () => {
    const donationAmount = 20_000;
    const result = calculateWompiFee(donationAmount);

    expect(result.coveredFeeAmount).toBe(
      result.coveredPercentageFeeAmount +
        result.coveredFixedFeeAmount +
        result.coveredIvaAmount,
    );
    expect(result.netReceivedIfCovered).toBeGreaterThanOrEqual(donationAmount);

    const onePesoLess = calculateWompiFee(result.totalWithFee - 1);
    expect(onePesoLess.baseAmount - onePesoLess.feeAmount).toBeLessThan(donationAmount);
  });

  it("calculates the maximum online donation without iterative fee adjustments", () => {
    const result = calculateWompiFee(MAX_DONATION_COP);

    expect(result.netReceivedIfCovered).toBeGreaterThanOrEqual(MAX_DONATION_COP);
    expect(result.totalWithFee).toBeLessThan(Number.MAX_SAFE_INTEGER / 100);
  });

  it("rejects amounts above the supported online limit", () => {
    expect(() => calculateWompiFee(MAX_DONATION_COP + 1)).toThrow(
      "El monto máximo para donar en línea",
    );
    expect(() => calculateWompiFee(Number.MAX_SAFE_INTEGER)).toThrow(
      "El monto máximo para donar en línea",
    );
  });
});

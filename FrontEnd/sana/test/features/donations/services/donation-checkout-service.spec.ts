import { beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.fn();

vi.mock("@/services/api/http-client", () => ({
  httpClient: { post: (...args: unknown[]) => post(...args) },
}));

import { startDonationCheckout } from "../../../../src/features/donations/services/donation-checkout-service";
import {
  calculateWompiFee,
  MAX_DONATION_COP,
} from "../../../../src/features/donations/services/wompi-service";

const BACKEND_CHECKOUT = {
  reference: "SANA-DON-REF-0001",
  amountInCents: 2_000_000,
  currency: "COP",
  signature: "firma",
};

describe("startDonationCheckout", () => {
  beforeEach(() => {
    post.mockReset();
    post.mockResolvedValue(BACKEND_CHECKOUT);
  });

  it("sends the base amount in cents and the terms acceptance to the backend", async () => {
    const checkout = await startDonationCheckout({
      amountCOP: 20_000,
      coverFee: false,
      termsAccepted: true,
    });

    expect(post).toHaveBeenCalledWith("/donations/checkout", {
      amountInCents: 2_000_000,
      termsAccepted: true,
    });
    expect(checkout).toMatchObject({
      reference: "SANA-DON-REF-0001",
      signature: "firma",
      amountCOP: 20_000,
    });
    expect(checkout.publicKey).toMatch(/^pub_/);
  });

  it("adds the Wompi fee when the donor chooses to cover it", async () => {
    const { totalWithFee } = calculateWompiFee(20_000);

    await startDonationCheckout({ amountCOP: 20_000, coverFee: true, termsAccepted: true });

    expect(post).toHaveBeenCalledWith("/donations/checkout", {
      amountInCents: totalWithFee * 100,
      termsAccepted: true,
    });
  });

  it("forwards a missing acceptance so the backend rejects it", async () => {
    await startDonationCheckout({ amountCOP: 20_000, coverFee: false, termsAccepted: false });

    expect(post.mock.calls[0][1]).toMatchObject({ termsAccepted: false });
  });

  it("rejects amounts outside the limits before calling the backend", async () => {
    await expect(
      startDonationCheckout({
        amountCOP: MAX_DONATION_COP + 1,
        coverFee: false,
        termsAccepted: true,
      }),
    ).rejects.toThrow("El monto de la donación no es válido.");
    expect(post).not.toHaveBeenCalled();
  });
});

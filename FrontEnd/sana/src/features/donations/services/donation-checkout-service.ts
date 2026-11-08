import { httpClient } from "@/services/api/http-client";
import { calculateWompiFee, MAX_DONATION_COP, MIN_DONATION_COP } from "./wompi-service";
import type { DonationFormData } from "../types/donation-types";

const WOMPI_PUBLIC_KEY = (
  process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY ||
  "pub_test_GSU1NtKHNeU3uByOGGJcTiN0AQHmWfxn"
).trim();

type BackendCheckout = {
  reference: string;
  amountInCents: number;
  currency: "COP";
  signature: string;
};

export type DonationCheckout = BackendCheckout & {
  amountCOP: number;
  publicKey: string;
};

/**
 * POST /donations/checkout: the backend records the acceptance of the
 * donation terms and signs the Wompi checkout.
 * @param data Amount, whether the donor covers the fee and the terms acceptance.
 * @returns Data required to open the Wompi widget.
 */
export async function startDonationCheckout(
  data: DonationFormData & { termsAccepted: boolean },
): Promise<DonationCheckout> {
  const baseCOP = Number(data.amountCOP);
  if (!Number.isSafeInteger(baseCOP) || baseCOP < MIN_DONATION_COP || baseCOP > MAX_DONATION_COP) {
    throw new RangeError("El monto de la donación no es válido.");
  }

  const amountCOP = data.coverFee ? calculateWompiFee(baseCOP).totalWithFee : baseCOP;
  const checkout = await httpClient.post<BackendCheckout>("/donations/checkout", {
    amountInCents: amountCOP * 100,
    termsAccepted: data.termsAccepted,
  });

  return { ...checkout, amountCOP, publicKey: WOMPI_PUBLIC_KEY };
}

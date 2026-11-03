import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  prepareDonationCheckoutAction,
} from '../../../../src/features/donations/actions/donation-actions';

describe('prepareDonationCheckoutAction', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('conserva la firma SHA-256 esperada para el checkout', async () => {
    vi.stubEnv('WOMPI_INTEGRITY_SECRET', 'test-secret');

    const checkout = await prepareDonationCheckoutAction({
      amountCOP: 20_000,
      coverFee: false,
    });
    const expectedSignature = createHash('sha256')
      .update(`${checkout.reference}${checkout.amountInCents}COPtest-secret`)
      .digest('hex');

    expect(checkout.signature).toBe(expectedSignature);
  });

});

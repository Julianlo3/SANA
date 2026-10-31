import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  prepareDonationCheckoutAction,
  verifyTransactionStatusAction,
} from '../../../../src/features/donations/actions/donation-actions';

describe('verifyTransactionStatusAction', () => {
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

  it('rechaza IDs que podrían alterar la ruta antes de llamar a Wompi', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const result = await verifyTransactionStatusAction('../admin?url=http://localhost');

    expect(result).toMatchObject({
      success: false,
      status: 'ERROR',
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('envía un ID válido a los hosts Wompi permitidos como un único segmento', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }));

    const result = await verifyTransactionStatusAction('  123456789-123-456  ');

    expect(result.status).toBe('PENDING');
    expect(fetchSpy).toHaveBeenNthCalledWith(
      1,
      new URL('https://api.wompi.co/v1/transactions/123456789-123-456'),
      expect.any(Object),
    );
    expect(fetchSpy).toHaveBeenNthCalledWith(
      2,
      new URL('https://sandbox.wompi.co/v1/transactions/123456789-123-456'),
      expect.any(Object),
    );
  });
});

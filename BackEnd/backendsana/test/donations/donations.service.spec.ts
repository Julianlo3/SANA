import { createHash } from 'node:crypto';
import { ServiceUnavailableException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it, vi } from 'vitest';
import { CHECKOUT_STATUS, DonationsService } from '../../src/donations/donations.service.js';
import { CreateDonationCheckoutDto } from '../../src/donations/dto/create-donation-checkout.dto.js';

const INTEGRITY_SECRET = 'test_integrity_secret';
const EVENTS_SECRET = 'test_events_secret';

function setup(config: Record<string, string | undefined> = {}) {
  const repository = {
    findOne: vi.fn().mockResolvedValue(null),
    find: vi.fn().mockResolvedValue([]),
    create: vi.fn((fields: object = {}) => ({ ...fields })),
    save: vi.fn(async (entity: object) => entity),
    manager: { query: vi.fn().mockResolvedValue([{ pd_id: 10 }]) },
  };
  const values: Record<string, string | undefined> = {
    WOMPI_INTEGRITY_SECRET: INTEGRITY_SECRET,
    WOMPI_EVENTS_SECRET: EVENTS_SECRET,
    ...config,
  };
  const configService = { get: vi.fn((key: string) => values[key]) };
  return {
    service: new DonationsService(repository as never, configService as never),
    repository,
  };
}

function checkoutDto(overrides: Record<string, unknown> = {}) {
  return plainToInstance(CreateDonationCheckoutDto, {
    amountInCents: 5_000_000,
    donorFullName: '  Ana Donante  ',
    donorEmail: 'ANA@EXAMPLE.COM',
    termsAccepted: true,
    ...overrides,
  });
}

function approvedEvent(reference: string) {
  const transaction = {
    id: '1234-1700000000-00001',
    reference,
    amount_in_cents: 5_000_000,
    currency: 'COP',
    status: 'APPROVED',
    payment_method_type: 'NEQUI',
    customer_email: 'ana@example.com',
    customer_data: { full_name: 'Ana Donante' },
    created_at: '2026-11-08T15:00:00.000Z',
  };
  const timestamp = 1_700_000_000;
  const properties = ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'];
  const checksum = createHash('sha256')
    .update(`${transaction.id}${transaction.status}${transaction.amount_in_cents}${timestamp}${EVENTS_SECRET}`)
    .digest('hex');
  return {
    event: 'transaction.updated',
    environment: 'test',
    timestamp,
    signature: { properties, checksum },
    data: { transaction },
  };
}

describe('DonationsService.createCheckout', () => {
  it('records the current donation terms, the acceptance time and the IP', async () => {
    const { service, repository } = setup();

    const result = await service.createCheckout(checkoutDto(), '203.0.113.7');

    expect(repository.manager.query).toHaveBeenCalledWith(
      expect.stringContaining("pd_type = 'donation_terms'"),
    );
    const saved = repository.save.mock.calls[0][0];
    expect(saved).toMatchObject({
      donReference: result.reference,
      donWompiTransactionId: `checkout:${result.reference}`,
      donAmountInCents: '5000000',
      donCurrency: 'COP',
      donStatus: CHECKOUT_STATUS,
      donDonorEmail: 'ana@example.com',
      donDonorFullName: 'Ana Donante',
      donTermsPdId: 10,
      donIpAddress: '203.0.113.7',
    });
    expect(saved.donTermsAcceptedAt).toBeInstanceOf(Date);
  });

  it('returns the Wompi integrity signature for the reference, amount and currency', async () => {
    const { service } = setup();

    const result = await service.createCheckout(checkoutDto());

    expect(result.reference).toMatch(/^SANA-DON-[0-9A-Z]+-[0-9A-F]{8}$/);
    expect(result).toMatchObject({ amountInCents: 5_000_000, currency: 'COP' });
    expect(result.signature).toBe(
      createHash('sha256')
        .update(`${result.reference}5000000COP${INTEGRITY_SECRET}`)
        .digest('hex'),
    );
  });

  it('rejects the checkout when the donor did not accept the donation terms', async () => {
    const { service, repository } = setup();

    await expect(
      service.createCheckout(checkoutDto({ termsAccepted: false })),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'TERMS_NOT_ACCEPTED' }),
    });
    expect(repository.save).not.toHaveBeenCalled();
    expect(repository.manager.query).not.toHaveBeenCalled();
  });

  it('rejects an amount with cents', async () => {
    const { service, repository } = setup();

    await expect(
      service.createCheckout(checkoutDto({ amountInCents: 5_000_050 })),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'INVALID_DONATION_AMOUNT' }),
    });
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('fails without saving when no donation terms are published', async () => {
    const { service, repository } = setup();
    repository.manager.query.mockResolvedValue([]);

    await expect(service.createCheckout(checkoutDto())).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('fails without saving when the integrity secret is not configured', async () => {
    const { service, repository } = setup({ WOMPI_INTEGRITY_SECRET: undefined });

    await expect(service.createCheckout(checkoutDto())).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });
});

describe('CreateDonationCheckoutDto', () => {
  async function invalidProperties(overrides: Record<string, unknown>) {
    return (await validate(checkoutDto(overrides))).map((error) => error.property);
  }

  it('accepts a valid checkout', async () => {
    await expect(invalidProperties({})).resolves.toEqual([]);
  });

  it.each([undefined, 'true', 1])('requires termsAccepted as a boolean (%s)', async (termsAccepted) => {
    await expect(invalidProperties({ termsAccepted })).resolves.toContain('termsAccepted');
  });

  it.each([99_900, 5_000_000_100, 10.5])('rejects the amount %s', async (amountInCents) => {
    await expect(invalidProperties({ amountInCents })).resolves.toContain('amountInCents');
  });

  it('rejects an invalid donor email', async () => {
    await expect(invalidProperties({ donorEmail: 'no-es-correo' })).resolves.toContain('donorEmail');
  });
});

describe('DonationsService webhook with a checkout', () => {
  it('completes the checkout row and keeps the terms acceptance', async () => {
    const { service, repository } = setup();
    const checkout = {
      donId: 3,
      donReference: 'SANA-DON-REF-0001',
      donWompiTransactionId: 'checkout:SANA-DON-REF-0001',
      donStatus: CHECKOUT_STATUS,
      donTermsPdId: 10,
      donTermsAcceptedAt: new Date('2026-11-08T14:59:00.000Z'),
      donIpAddress: '203.0.113.7',
      donDonorEmail: 'ana@example.com',
      donDonorFullName: 'Ana Donante',
    };
    repository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(checkout);

    await expect(
      service.processWompiEvent(approvedEvent('SANA-DON-REF-0001')),
    ).resolves.toEqual({ received: true, registered: true });

    expect(repository.findOne).toHaveBeenNthCalledWith(2, {
      where: { donReference: 'SANA-DON-REF-0001', donStatus: CHECKOUT_STATUS },
    });
    expect(repository.save).toHaveBeenCalledWith(checkout);
    expect(checkout).toMatchObject({
      donId: 3,
      donWompiTransactionId: '1234-1700000000-00001',
      donStatus: 'APPROVED',
      donPaymentMethodType: 'NEQUI',
      donTermsPdId: 10,
      donIpAddress: '203.0.113.7',
    });
  });

  it('still registers an approved donation that has no checkout row', async () => {
    const { service, repository } = setup();

    await service.processWompiEvent(approvedEvent('SANA-DON-LEGACY'));

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        donWompiTransactionId: '1234-1700000000-00001',
        donReference: 'SANA-DON-LEGACY',
        donStatus: 'APPROVED',
      }),
    );
    expect(repository.save.mock.calls[0][0]).not.toHaveProperty('donTermsPdId');
  });

  it('hides unfinished checkouts from the donation list', async () => {
    const { service, repository } = setup();

    await service.findAll();

    const options = repository.find.mock.calls[0][0];
    expect(options.where.donStatus).toMatchObject({ _type: 'not', _value: CHECKOUT_STATUS });
  });
});

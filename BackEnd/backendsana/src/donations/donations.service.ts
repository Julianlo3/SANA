import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Donation } from './entities/donation.entity.js';
import type { CreateDonationCheckoutDto } from './dto/create-donation-checkout.dto.js';
import type { WompiEvent, WompiTransaction } from './wompi-event.js';

export const CHECKOUT_STATUS = 'CHECKOUT';
const CHECKOUT_TRANSACTION_PREFIX = 'checkout:';
const DONATION_CURRENCY = 'COP';

export interface DonationCheckout {
  reference: string;
  amountInCents: number;
  currency: typeof DONATION_CURRENCY;
  signature: string;
}

function generateDonationReference(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomBytes(4).toString('hex').toUpperCase();
  return `SANA-DON-${timestamp}-${random}`;
}

@Injectable()
export class DonationsService {
  private readonly logger = new Logger(DonationsService.name);

  constructor(
    @InjectRepository(Donation)
    private readonly donationRepository: Repository<Donation>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Starts a Wompi checkout: records the donor's acceptance of the current
   * donation terms and returns the reference and integrity signature that
   * the Wompi widget needs. The row stays in CHECKOUT status until the
   * approved webhook arrives.
   * @param dto Amount, optional donor data and the terms acceptance.
   * @param ipAddress IP address of the donor.
   * @returns Data required to open the Wompi checkout.
   */
  async createCheckout(
    dto: CreateDonationCheckoutDto,
    ipAddress?: string,
  ): Promise<DonationCheckout> {
    if (dto.termsAccepted !== true) {
      throw new BadRequestException({
        error: 'TERMS_NOT_ACCEPTED',
        message: 'Debe aceptar las condiciones de donación y la política de tratamiento de datos personales para continuar',
      });
    }
    if (dto.amountInCents % 100 !== 0) {
      throw new BadRequestException({
        error: 'INVALID_DONATION_AMOUNT',
        message: 'El monto de la donación debe ser un valor entero en pesos',
      });
    }

    const integritySecret = this.configService.get<string>('WOMPI_INTEGRITY_SECRET')?.trim();
    if (!integritySecret) {
      throw new ServiceUnavailableException('Wompi checkout is not configured');
    }

    const termsPdId = await this.getCurrentDonationTermsId();
    if (!termsPdId) {
      throw new ServiceUnavailableException('Donation terms are not configured');
    }

    const reference = generateDonationReference();
    const signature = createHash('sha256')
      .update(`${reference}${dto.amountInCents}${DONATION_CURRENCY}${integritySecret}`)
      .digest('hex');

    await this.donationRepository.save(
      this.donationRepository.create({
        donWompiTransactionId: `${CHECKOUT_TRANSACTION_PREFIX}${reference}`,
        donReference: reference,
        donAmountInCents: String(dto.amountInCents),
        donCurrency: DONATION_CURRENCY,
        donStatus: CHECKOUT_STATUS,
        donDonorEmail: dto.donorEmail?.trim().toLowerCase() ?? null,
        donDonorFullName: dto.donorFullName?.trim() || null,
        donTermsPdId: termsPdId,
        donTermsAcceptedAt: new Date(),
        donIpAddress: ipAddress ?? null,
      }),
    );
    this.logger.log(`Donation checkout created: reference-${reference}, termsPdId-${termsPdId}`);

    return {
      reference,
      amountInCents: dto.amountInCents,
      currency: DONATION_CURRENCY,
      signature,
    };
  }

  private async getCurrentDonationTermsId(): Promise<number | null> {
    const rows = await this.donationRepository.manager.query<{ pd_id: number }[]>(
      `SELECT pd_id
       FROM policy_documents
       WHERE pd_type = 'donation_terms'
       ORDER BY pd_effective_from DESC, pd_id DESC
       LIMIT 1`,
    );
    return rows[0]?.pd_id ?? null;
  }

  /**
   * Registers an approved donation only after a signed Wompi webhook arrives.
   * Wompi can retry events, so an existing transaction is a successful no-op.
   */
  async processWompiEvent(
    payload: unknown,
    headerChecksum?: string,
  ): Promise<{ received: true; registered: boolean }> {
    const event = this.parseAndVerifyWompiEvent(payload, headerChecksum);
    const transaction = event.data.transaction;

    if (event.event === 'transaction.updated') {
      this.logTransactionStatus(transaction);
    }

    // No payment record is created for pending, declined, voided, or unrelated events.
    if (event.event !== 'transaction.updated' || transaction.status !== 'APPROVED') {
      return { received: true, registered: false };
    }

    const existing = await this.donationRepository.findOne({
      where: { donWompiTransactionId: transaction.id },
    });

    if (existing) {
      return { received: true, registered: false };
    }

    const checkout = await this.donationRepository.findOne({
      where: { donReference: transaction.reference, donStatus: CHECKOUT_STATUS },
    });
    const donation = checkout ?? this.donationRepository.create();
    Object.assign(donation, {
      donWompiTransactionId: transaction.id,
      donReference: transaction.reference,
      donAmountInCents: String(transaction.amount_in_cents),
      donCurrency: transaction.currency,
      donStatus: transaction.status,
      donPaymentMethodType: transaction.payment_method_type ?? null,
      donDonorEmail: transaction.customer_email ?? checkout?.donDonorEmail ?? null,
      donDonorFullName:
        transaction.customer_data?.full_name ?? checkout?.donDonorFullName ?? null,
      donEnvironment: event.environment,
      donWompiCreatedAt: transaction.created_at ? new Date(transaction.created_at) : null,
    });

    await this.donationRepository.save(donation);
    this.logger.log(`Approved donation registered: transactionId-${transaction.id}`);
    return { received: true, registered: true };
  }

  private logTransactionStatus(transaction: WompiTransaction): void {
    const transactionId = `transactionId-${transaction.id}`;
    switch (transaction.status) {
      case 'APPROVED':
        this.logger.log(`Wompi donation approved: ${transactionId}`);
        break;
      case 'DECLINED':
      case 'VOIDED':
      case 'ERROR': {
        const reason = transaction.status_message?.trim().slice(0, 250) || transaction.status;
        this.logger.warn(`Wompi donation ${transaction.status.toLowerCase()}: ${transactionId}, reason-${reason}`);
        break;
      }
      default:
        this.logger.log(`Wompi donation update: ${transactionId}, status-${transaction.status}`);
    }
  }

  private parseAndVerifyWompiEvent(payload: unknown, headerChecksum?: string): WompiEvent {
    if (!this.isWompiEvent(payload)) {
      throw new BadRequestException('Invalid Wompi event payload');
    }

    const secret = this.configService.get<string>('WOMPI_EVENTS_SECRET')?.trim();
    if (!secret) {
      throw new UnauthorizedException('Wompi events are not configured');
    }

    const values = payload.signature.properties.map((property) => {
      const value = this.readDataProperty(payload.data, property);
      if (value === undefined || value === null || typeof value === 'object') {
        throw new BadRequestException('Invalid Wompi signature property');
      }
      return String(value);
    });
    const expected = createHash('sha256')
      .update(`${values.join('')}${payload.timestamp}${secret}`)
      .digest('hex');
    const received = (headerChecksum ?? payload.signature.checksum).trim().toLowerCase();

    if (!this.safeChecksumEquals(expected, received)) {
      throw new UnauthorizedException('Invalid Wompi event signature');
    }
    return payload;
  }

  private readDataProperty(data: Record<string, unknown>, property: string): unknown {
    if (!/^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/.test(property)) {
      return undefined;
    }
    return property.split('.').reduce<unknown>((current, segment) =>
      current && typeof current === 'object' && !Array.isArray(current)
        ? (current as Record<string, unknown>)[segment]
        : undefined, data);
  }

  private safeChecksumEquals(expected: string, received: string): boolean {
    const expectedBuffer = Buffer.from(expected, 'utf8');
    const receivedBuffer = Buffer.from(received, 'utf8');
    return expectedBuffer.length === receivedBuffer.length &&
      timingSafeEqual(expectedBuffer, receivedBuffer);
  }

  private isWompiEvent(payload: unknown): payload is WompiEvent {
    if (!payload || typeof payload !== 'object') return false;
    const event = payload as Partial<WompiEvent>;
    const transaction = event.data?.transaction as Partial<WompiTransaction> | undefined;
    return typeof event.event === 'string' &&
      typeof event.environment === 'string' &&
      Number.isInteger(event.timestamp) &&
      Array.isArray(event.signature?.properties) &&
      event.signature.properties.every((property) => typeof property === 'string') &&
      typeof event.signature.checksum === 'string' &&
      !!transaction &&
      typeof transaction.id === 'string' &&
      typeof transaction.reference === 'string' &&
      typeof transaction.amount_in_cents === 'number' &&
      typeof transaction.currency === 'string' &&
      typeof transaction.status === 'string';
  }

  /**
   * List all donations ordered by most recent first.
   */
  async findAll(): Promise<Donation[]> {
    return this.donationRepository.find({
      where: { donStatus: Not(CHECKOUT_STATUS) },
      order: { donCreatedAt: 'DESC' },
    });
  }

  /**
   * Find a donation by its Wompi transaction ID.
   */
  async findByTransactionId(transactionId: string): Promise<Donation | null> {
    return this.donationRepository.findOne({
      where: { donWompiTransactionId: transactionId, donStatus: Not(CHECKOUT_STATUS) },
    });
  }
}

import { createHash, timingSafeEqual } from 'node:crypto';
import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donation } from './entities/donation.entity.js';
import type { WompiEvent, WompiTransaction } from './wompi-event.js';

@Injectable()
export class DonationsService {
  private readonly logger = new Logger(DonationsService.name);

  constructor(
    @InjectRepository(Donation)
    private readonly donationRepository: Repository<Donation>,
    private readonly configService: ConfigService,
  ) {}

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

    const donation = this.donationRepository.create({
      donWompiTransactionId: transaction.id,
      donReference: transaction.reference,
      donAmountInCents: String(transaction.amount_in_cents),
      donCurrency: transaction.currency,
      donStatus: transaction.status,
      donPaymentMethodType: transaction.payment_method_type ?? null,
      donDonorEmail: transaction.customer_email ?? null,
      donDonorFullName: transaction.customer_data?.full_name ?? null,
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
      order: { donCreatedAt: 'DESC' },
    });
  }

  /**
   * Find a donation by its Wompi transaction ID.
   */
  async findByTransactionId(transactionId: string): Promise<Donation | null> {
    return this.donationRepository.findOne({
      where: { donWompiTransactionId: transactionId },
    });
  }
}

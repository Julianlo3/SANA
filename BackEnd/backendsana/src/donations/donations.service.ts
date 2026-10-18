import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donation } from './entities/donation.entity.js';
import type { RegisterDonationDto } from './dto/register-donation.dto.js';

@Injectable()
export class DonationsService {
  constructor(
    @InjectRepository(Donation)
    private readonly donationRepository: Repository<Donation>,
  ) {}

  /**
   * Register a new donation from a completed Wompi transaction.
   */
  async register(dto: RegisterDonationDto): Promise<Donation> {
    // Check if transaction already registered
    const existing = await this.donationRepository.findOne({
      where: { donWompiTransactionId: dto.wompiTransactionId },
    });

    if (existing) {
      throw new ConflictException(
        `Donation with Wompi transaction ID ${dto.wompiTransactionId} is already registered`,
      );
    }

    const donation = this.donationRepository.create({
      donWompiTransactionId: dto.wompiTransactionId,
      donReference: dto.reference,
      donAmountInCents: String(dto.amountInCents),
      donCurrency: dto.currency,
      donStatus: dto.status,
      donPaymentMethodType: dto.paymentMethodType ?? null,
      donDonorEmail: dto.donorEmail ?? null,
      donDonorFullName: dto.donorFullName ?? null,
      donEnvironment: dto.environment ?? 'test',
      donWompiCreatedAt: dto.wompiCreatedAt ? new Date(dto.wompiCreatedAt) : null,
    });

    return this.donationRepository.save(donation);
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

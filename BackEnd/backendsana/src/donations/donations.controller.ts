import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OriginGuard } from '../guards/origin.guard.js';
import { DonationsService } from './donations.service.js';
import { RegisterDonationDto } from './dto/register-donation.dto.js';

@Controller('donations')
@UseGuards(OriginGuard)
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  /**
   * Register a completed Wompi donation transaction.
   * POST /api/v1/donations
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDonationDto) {
    return this.donationsService.register(dto);
  }

  /**
   * List all registered donations.
   * GET /api/v1/donations
   */
  @Get()
  findAll() {
    return this.donationsService.findAll();
  }

  /**
   * Find a donation by Wompi transaction ID.
   * GET /api/v1/donations/:transactionId
   */
  @Get(':transactionId')
  findByTransactionId(@Param('transactionId') transactionId: string) {
    return this.donationsService.findByTransactionId(transactionId);
  }
}

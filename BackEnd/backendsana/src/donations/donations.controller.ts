import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Headers,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { OriginGuard } from '../guards/origin.guard.js';
import { RateLimitGuard } from '../guards/rate-limit.guard.js';
import { RateLimit } from '../middlewares/rate-limit.decorator.js';
import { DonationsService } from './donations.service.js';
import { CreateDonationCheckoutDto } from './dto/create-donation-checkout.dto.js';

@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  /**
   * Public endpoint: records the acceptance of the donation terms and returns
   * the reference and integrity signature for the Wompi checkout.
   * POST /api/v1/donations/checkout
   */
  @Post('checkout')
  @UseGuards(OriginGuard, RateLimitGuard)
  @RateLimit({ limit: 10, windowSeconds: 60 })
  @HttpCode(HttpStatus.CREATED)
  createCheckout(@Body() dto: CreateDonationCheckoutDto, @Req() request: Request) {
    const ipAddress = request.ip || request.socket.remoteAddress;
    return this.donationsService.createCheckout(dto, ipAddress);
  }

  /**
   * Receives signed Wompi transaction events. This is intentionally not
   * protected by OriginGuard: Wompi is a server, not a browser.
   * POST /api/v1/donations/webhooks/wompi
   */
  @Post('webhooks/wompi')
  @HttpCode(HttpStatus.OK)
  receiveWompiEvent(
    @Headers('x-event-checksum') checksum: string | undefined,
    @Body() event: unknown,
  ) {
    return this.donationsService.processWompiEvent(event, checksum);
  }

  /**
   * List all registered donations.
   * GET /api/v1/donations
   */
  @Get()
  @UseGuards(OriginGuard)
  findAll() {
    return this.donationsService.findAll();
  }

  /**
   * Find a donation by Wompi transaction ID.
   * GET /api/v1/donations/:transactionId
   */
  @Get(':transactionId')
  @UseGuards(OriginGuard)
  findByTransactionId(@Param('transactionId') transactionId: string) {
    return this.donationsService.findByTransactionId(transactionId);
  }
}

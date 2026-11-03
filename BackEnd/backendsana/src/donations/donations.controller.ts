import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { OriginGuard } from '../guards/origin.guard.js';
import { DonationsService } from './donations.service.js';

@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

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

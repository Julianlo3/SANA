import { Controller, Get, UseGuards } from '@nestjs/common';
import { RateLimitGuard } from '../../guards/rate-limit.guard.js';
import { RateLimit } from '../../middlewares/rate-limit.decorator.js';
import { BannersService } from './banners.service.js';

/**
 * Read-only banners endpoint for the public site. Only active banners are returned.
 */
@Controller('public/banners')
@UseGuards(RateLimitGuard)
@RateLimit({ limit: 120, windowSeconds: 60 })
export class PublicBannersController {
  constructor(private readonly bannersService: BannersService) {}

  /**
   * Finds the banners to show on the home page right now.
   * @returns A promise that resolves to the current banners.
   */
  @Get()
  findAll() {
    return this.bannersService.findCurrent();
  }
}

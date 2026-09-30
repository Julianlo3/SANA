import { Controller, Get, UseGuards } from '@nestjs/common';
import { RateLimitGuard } from '../guards/rate-limit.guard.js';
import { RateLimit } from '../middlewares/rate-limit.decorator.js';
import { ContentService } from './content.service.js';

/**
 * Read-only endpoints for the public site. No session required.
 */
@Controller('public/content')
@UseGuards(RateLimitGuard)
@RateLimit({ limit: 120, windowSeconds: 60 })
export class PublicContentController {
  constructor(private readonly contentService: ContentService) {}

  /**
   * Finds the published institutional content.
   * @returns A promise that resolves to the content grouped by section.
   */
  @Get()
  findAll() {
    return this.contentService.findPublicContent();
  }
}

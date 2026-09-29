import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { RateLimitGuard } from '../../guards/rate-limit.guard.js';
import { RateLimit } from '../../middlewares/rate-limit.decorator.js';
import { PublicNewsQueryDto } from './news.dto.js';
import { NewsService } from './news.service.js';

/**
 * Read-only news endpoints for the public site. Only published news are returned.
 */
@Controller('public/news')
@UseGuards(RateLimitGuard)
@RateLimit({ limit: 120, windowSeconds: 60 })
export class PublicNewsController {
  constructor(private readonly newsService: NewsService) {}

  /**
   * Finds a page of published news, pinned first and newest first.
   * @param query The page and page size.
   * @returns A promise that resolves to the page of news.
   */
  @Get()
  findAll(@Query() query: PublicNewsQueryDto) {
    return this.newsService.findPublished(query);
  }

  /**
   * Finds a published news item.
   * @param id The ID of the news item.
   * @returns A promise that resolves to the news item.
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.findPublishedById(id);
  }
}

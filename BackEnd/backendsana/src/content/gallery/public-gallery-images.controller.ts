import { Controller, Get, UseGuards } from '@nestjs/common';
import { RateLimitGuard } from '../../guards/rate-limit.guard.js';
import { RateLimit } from '../../middlewares/rate-limit.decorator.js';
import { GalleryService } from './gallery.service.js';
import { ApiControllerDocs } from '../../openapi/api-controller-docs.decorator.js';

/**
 * Read-only gallery endpoint for the public site. Only published images are returned.
 */
@Controller('public/gallery-images')
@ApiControllerDocs('Public gallery')
@UseGuards(RateLimitGuard)
@RateLimit({ limit: 120, windowSeconds: 60 })
export class PublicGalleryImagesController {
  constructor(private readonly galleryService: GalleryService) {}

  /**
   * Finds the published gallery images.
   * @returns A promise that resolves to the images by position.
   */
  @Get()
  findAll() {
    return this.galleryService.findPublished();
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import { OriginGuard } from '../../guards/origin.guard.js';
import { RolesGuard } from '../../guards/roles.guard.js';
import type { AuthenticatedUser } from '../../auth/auth.interface.js';
import { Roles } from '../../middlewares/roles.decorator.js';
import { Section } from '../../middlewares/section.decorator.js';
import { UserRole } from '../../models/user-role.enum.js';
import { UpdatePublicationStatusDto } from '../news/news.dto.js';
import { CreateGalleryImageDto, UpdateGalleryImageDto } from './gallery.dto.js';
import { GalleryService } from './gallery.service.js';

/**
 * Controller for managing gallery images from the admin panel.
 */
@Controller('gallery-images')
@UseGuards(OriginGuard, JwtAuthGuard, RolesGuard)
@Roles(UserRole.Administrator, UserRole.Marketing)
@Section('Content Management')
export class GalleryImagesController {
  constructor(private readonly galleryService: GalleryService) {}

  /**
   * Finds every gallery image, including retired ones.
   * @returns A promise that resolves to the images.
   */
  @Get()
  findAll() {
    return this.galleryService.findAll();
  }

  /**
   * Adds an image to the gallery.
   * @param request The HTTP request object containing the authenticated user.
   * @param dto The image data.
   * @returns A promise that resolves to the created image.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() request: Request & { user: AuthenticatedUser },
    @Body() dto: CreateGalleryImageDto,
  ) {
    return this.galleryService.create(request.user, dto);
  }

  /**
   * Edits a gallery image.
   * @param request The HTTP request object containing the authenticated user.
   * @param id The ID of the image.
   * @param dto The fields to change.
   * @returns A promise that resolves to the updated image.
   */
  @Patch(':id')
  update(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGalleryImageDto,
  ) {
    return this.galleryService.update(request.user, id, dto);
  }

  /**
   * Publishes or retires a gallery image.
   * @param request The HTTP request object containing the authenticated user.
   * @param id The ID of the image.
   * @param dto The new status.
   * @returns A promise that resolves to the updated image.
   */
  @Patch(':id/status')
  updateStatus(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePublicationStatusDto,
  ) {
    return this.galleryService.setStatus(request.user, id, dto.status);
  }

  /**
   * Permanently deletes a retired gallery image.
   * @param request The HTTP request object containing the authenticated user.
   * @param id The ID of the image.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.galleryService.delete(request.user, id);
  }
}

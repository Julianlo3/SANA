import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { OriginGuard } from '../guards/origin.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import type { AuthenticatedUser } from '../interfaces/auth.interface.js';
import { Roles } from '../middlewares/roles.decorator.js';
import { Section } from '../middlewares/section.decorator.js';
import { UserRole } from '../models/user-role.enum.js';
import { ContentService } from './content.service.js';
import { UpdateContentItemsDto } from './dto/update-content-items.dto.js';

/**
 * Controller for single-value institutional content (mission and vision).
 */
@Controller('content-items')
@UseGuards(OriginGuard, JwtAuthGuard, RolesGuard)
@Roles(UserRole.Administrator, UserRole.Marketing)
@Section('Content Management')
export class ContentItemsController {
  constructor(private readonly contentService: ContentService) {}

  /**
   * Finds the editable content items with their last editor.
   * @returns A promise that resolves to the content items.
   */
  @Get()
  findAll() {
    return this.contentService.findItems();
  }

  /**
   * Saves one or more content items.
   * @param request The HTTP request object containing the authenticated user.
   * @param dto The items to save.
   * @returns A promise that resolves to the updated content items.
   */
  @Patch()
  update(
    @Req() request: Request & { user: AuthenticatedUser },
    @Body() dto: UpdateContentItemsDto,
  ) {
    return this.contentService.saveItems(request.user, dto);
  }
}

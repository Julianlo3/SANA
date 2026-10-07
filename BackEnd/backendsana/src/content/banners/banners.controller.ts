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
import {
  CreateBannerDto,
  UpdateBannerActivationDto,
  UpdateBannerDto,
} from './banners.dto.js';
import { BannersService } from './banners.service.js';

/**
 * Controller for managing home page banners from the admin panel.
 */
@Controller('banners')
@UseGuards(OriginGuard, JwtAuthGuard, RolesGuard)
@Roles(UserRole.Administrator, UserRole.Marketing)
@Section('Content Management')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  /**
   * Finds every banner with the active counter.
   * @returns A promise that resolves to the banners and the active limit.
   */
  @Get()
  findAll() {
    return this.bannersService.findAll();
  }

  /**
   * Creates a banner.
   * @param request The HTTP request object containing the authenticated user.
   * @param dto The banner data.
   * @returns A promise that resolves to the created banner.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() request: Request & { user: AuthenticatedUser },
    @Body() dto: CreateBannerDto,
  ) {
    return this.bannersService.create(request.user, dto);
  }

  /**
   * Edits a banner.
   * @param request The HTTP request object containing the authenticated user.
   * @param id The ID of the banner.
   * @param dto The fields to change.
   * @returns A promise that resolves to the updated banner.
   */
  @Patch(':id')
  update(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBannerDto,
  ) {
    return this.bannersService.update(request.user, id, dto);
  }

  /**
   * Activates or deactivates a banner.
   * @param request The HTTP request object containing the authenticated user.
   * @param id The ID of the banner.
   * @param dto The new activation state.
   * @returns A promise that resolves to the updated banner.
   */
  @Patch(':id/activation')
  updateActivation(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBannerActivationDto,
  ) {
    return this.bannersService.setActive(request.user, id, dto.isActive);
  }

  /**
   * Permanently deletes an inactive banner.
   * @param request The HTTP request object containing the authenticated user.
   * @param id The ID of the banner.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.bannersService.delete(request.user, id);
  }
}

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
import { JwtAuthGuard } from '../../guards/jwt-auth.guard.js';
import { OriginGuard } from '../../guards/origin.guard.js';
import { RolesGuard } from '../../guards/roles.guard.js';
import type { AuthenticatedUser } from '../../interfaces/auth.interface.js';
import { Roles } from '../../middlewares/roles.decorator.js';
import { Section } from '../../middlewares/section.decorator.js';
import { UserRole } from '../../models/user-role.enum.js';
import {
  CreateNewsDto,
  UpdateNewsDto,
  UpdateNewsPinDto,
  UpdatePublicationStatusDto,
} from './news.dto.js';
import { NewsService } from './news.service.js';

/**
 * Controller for managing news from the admin panel.
 */
@Controller('news')
@UseGuards(OriginGuard, JwtAuthGuard, RolesGuard)
@Roles(UserRole.Administrator, UserRole.Marketing)
@Section('Content Management')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  /**
   * Finds every news item, including retired ones.
   * @returns A promise that resolves to the news.
   */
  @Get()
  findAll() {
    return this.newsService.findAll();
  }

  /**
   * Publishes a news item.
   * @param request The HTTP request object containing the authenticated user.
   * @param dto The news data.
   * @returns A promise that resolves to the created news item.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() request: Request & { user: AuthenticatedUser },
    @Body() dto: CreateNewsDto,
  ) {
    return this.newsService.create(request.user, dto);
  }

  /**
   * Edits a news item.
   * @param request The HTTP request object containing the authenticated user.
   * @param id The ID of the news item.
   * @param dto The fields to change.
   * @returns A promise that resolves to the updated news item.
   */
  @Patch(':id')
  update(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNewsDto,
  ) {
    return this.newsService.update(request.user, id, dto);
  }

  /**
   * Publishes or retires a news item.
   * @param request The HTTP request object containing the authenticated user.
   * @param id The ID of the news item.
   * @param dto The new status.
   * @returns A promise that resolves to the updated news item.
   */
  @Patch(':id/status')
  updateStatus(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePublicationStatusDto,
  ) {
    return this.newsService.setStatus(request.user, id, dto.status);
  }

  /**
   * Pins or unpins a news item.
   * @param request The HTTP request object containing the authenticated user.
   * @param id The ID of the news item.
   * @param dto Whether the item must be pinned.
   * @returns A promise that resolves to the updated news item.
   */
  @Patch(':id/pin')
  updatePin(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateNewsPinDto,
  ) {
    return this.newsService.setPinned(request.user, id, dto.isPinned);
  }

  /**
   * Permanently deletes a retired news item.
   * @param request The HTTP request object containing the authenticated user.
   * @param id The ID of the news item.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.newsService.delete(request.user, id);
  }
}

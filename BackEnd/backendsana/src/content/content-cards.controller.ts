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
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { OriginGuard } from '../guards/origin.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import type { AuthenticatedUser } from '../interfaces/auth.interface.js';
import { Roles } from '../middlewares/roles.decorator.js';
import { Section } from '../middlewares/section.decorator.js';
import { UserRole } from '../models/user-role.enum.js';
import { ContentService } from './content.service.js';
import { ContentCardsQueryDto } from './dto/content-cards-query.dto.js';
import { CreateContentCardDto } from './dto/create-content-card.dto.js';
import { UpdateContentCardDto } from './dto/update-content-card.dto.js';

/**
 * Controller for list-based institutional content: values, team, services and programs.
 */
@Controller('content-cards')
@UseGuards(OriginGuard, JwtAuthGuard, RolesGuard)
@Roles(UserRole.Administrator, UserRole.Marketing)
@Section('Content Management')
export class ContentCardsController {
  constructor(private readonly contentService: ContentService) {}

  /**
   * Finds the content cards, optionally filtered by section.
   * @param query The query parameters.
   * @returns A promise that resolves to the content cards.
   */
  @Get()
  findAll(@Query() query: ContentCardsQueryDto) {
    return this.contentService.findCards(query);
  }

  /**
   * Creates a content card.
   * @param request The HTTP request object containing the authenticated user.
   * @param dto The card data.
   * @returns A promise that resolves to the created card.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() request: Request & { user: AuthenticatedUser },
    @Body() dto: CreateContentCardDto,
  ) {
    return this.contentService.createCard(request.user, dto);
  }

  /**
   * Updates a content card.
   * @param request The HTTP request object containing the authenticated user.
   * @param id The ID of the card.
   * @param dto The fields to change.
   * @returns A promise that resolves to the updated card.
   */
  @Patch(':id')
  update(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContentCardDto,
  ) {
    return this.contentService.updateCard(request.user, id, dto);
  }

  /**
   * Deletes a content card.
   * @param request The HTTP request object containing the authenticated user.
   * @param id The ID of the card.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.contentService.deleteCard(request.user, id);
  }
}

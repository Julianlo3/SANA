import {
  Body,
  Controller,
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
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { OriginGuard } from '../guards/origin.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import type { AuthenticatedUser } from '../auth/auth.interface.js';
import { Roles } from '../middlewares/roles.decorator.js';
import { UserRole } from '../models/user-role.enum.js';
import { ConsultantsService } from './consultants.service.js';
import { CreateConsultantDto } from './dto/create-consultant.dto.js';
import { UpdateConsultantDto } from './dto/update-consultant.dto.js';

/**
 * Consultant controller
 * All endpoints are protected for the secretary role
 */
@Controller('consultants')
@UseGuards(OriginGuard, JwtAuthGuard, RolesGuard)
@Roles(UserRole.Secretary)
export class ConsultantsController {
  constructor(private readonly consultantsService: ConsultantsService) { }

  /**
   * Finds all consultants.
   * @returns A list of consultants.
   */
  @Get()
  findAll() {
    return this.consultantsService.findAll();
  }

  /**
   * Finds a consultant by id.
   * @param id The id of the consultant to find.
   * @returns The consultant with the specified id.
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.consultantsService.findOne(id);
  }

  /**
   * Creates a new consultant record.
   * @param request The request containing the authenticated user.
   * @param dto The data for the new consultant record.
   * @returns The newly created consultant record.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Req() request: Request & { user: AuthenticatedUser },
    @Body() dto: CreateConsultantDto,
  ) {
    return this.consultantsService.create(dto, request.user.userId);
  }

  /**
   * Updates a consultant record.
   * @param request The request containing the authenticated user.
   * @param id The id of the consultant to update.
   * @param dto The data for the consultant record to update.
   * @returns The updated consultant record.
   */
  @Patch(':id')
  update(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateConsultantDto,
  ) {
    return this.consultantsService.update(id, dto, request.user.userId);
  }
}

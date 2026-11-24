import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiParam, ApiQuery } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { OriginGuard } from '../guards/origin.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { Roles } from '../middlewares/roles.decorator.js';
import { UserRole } from '../models/user-role.enum.js';
import type { AuthenticatedUser } from '../auth/auth.interface.js';
import { CarePackagesService } from './care-packages.service.js';
import { ApiControllerDocs } from '../openapi/api-controller-docs.decorator.js';
import {
  ApproveCarePackageDto,
  CarePackageAvailabilityQueryDto,
  CloseCarePackageDto,
  CreateCarePackageDto,
  RejectCarePackageDto,
  ScheduleFollowUpValuationDto,
  SchedulePackageAppointmentDto,
  SuggestCarePackageDto,
} from './dto/care-package.dto.js';

@Controller('care-packages')
@ApiControllerDocs('Care packages', true)
@UseGuards(OriginGuard, JwtAuthGuard, RolesGuard)
export class CarePackagesController {
  constructor(private readonly service: CarePackagesService) {}

  /**
   * Psychologist suggests a care package after valuation.
   */
  @Post('suggest')
  @Roles(UserRole.Psychologist)
  suggest(
    @Body() dto: SuggestCarePackageDto,
    @Req() r: Request & { user: AuthenticatedUser },
  ) {
    return this.service.suggest(dto, r.user.personId);
  }

  /**
   * Secretary views pending suggestions.
   */
  @Get('suggestions')
  @Roles(UserRole.Secretary)
  findSuggestions() {
    return this.service.findSuggestions();
  }

  /**
   * Consultant views their own active/past packages.
   */
  @Get('my-packages')
  @Roles(UserRole.Requester)
  findMyPackages(@Req() r: Request & { user: AuthenticatedUser }) {
    return this.service.findMyPackages(r.user.personId);
  }

  /**
   * Secretary lists all packages (with optional ?state= filter).
   */
  @Get()
  @ApiQuery({
    name: 'state',
    required: false,
    description: 'Filter care packages by their current state.',
  })
  @Roles(UserRole.Secretary)
  findAll(@Query('state') state?: string) {
    return this.service.findAll(state);
  }

  /**
   * Secretary approves a suggested package.
   */
  @Patch(':id/approve')
  @ApiParam({ name: 'id', description: 'Care package identifier.', type: Number })
  @Roles(UserRole.Secretary)
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveCarePackageDto,
    @Req() r: Request & { user: AuthenticatedUser },
  ) {
    return this.service.approve(id, dto, r.user.personId);
  }

  /**
   * Secretary rejects a suggested package.
   */
  @Patch(':id/reject')
  @ApiParam({ name: 'id', description: 'Care package identifier.', type: Number })
  @Roles(UserRole.Secretary)
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectCarePackageDto,
    @Req() r: Request & { user: AuthenticatedUser },
  ) {
    return this.service.reject(id, dto, r.user.personId);
  }

  /**
   * Secretary creates a package directly.
   */
  @Post()
  @Roles(UserRole.Secretary)
  create(
    @Body() dto: CreateCarePackageDto,
    @Req() r: Request & { user: AuthenticatedUser },
  ) {
    return this.service.create(dto, r.user.personId);
  }

  /**
   * Details of a package.
   */
  @Get(':id')
  @ApiParam({ name: 'id', description: 'Care package identifier.', type: Number })
  @Roles(UserRole.Secretary, UserRole.Psychologist, UserRole.Requester)
  find(
    @Param('id', ParseIntPipe) id: number,
    @Req() r: Request & { user: AuthenticatedUser },
  ) {
    return this.service.find(id, { requesterId: r.user.personId });
  }

  /**
   * Lists up to 30 days of availability for the package psychologist.
   * @param id Care package identifier.
   * @param q Availability range and appointment duration.
   * @param r Authenticated requester or secretary.
   * @returns A promise resolving to the package psychologist's available slots.
   */
  @Get(':id/availability')
  @ApiParam({ name: 'id', description: 'Care package identifier.', type: Number })
  @Roles(UserRole.Requester, UserRole.Secretary)
  availability(
    @Param('id', ParseIntPipe) id: number,
    @Query() q: CarePackageAvailabilityQueryDto,
    @Req() r: Request & { user: AuthenticatedUser },
  ) {
    return this.service.availability(
      id,
      { requesterId: r.user.personId, secretaryId: r.user.personId },
      q,
    );
  }

  /**
   * Secretary schedules an appointment inside the package.
   */
  @Post(':id/appointments')
  @ApiParam({ name: 'id', description: 'Care package identifier.', type: Number })
  @Roles(UserRole.Secretary)
  schedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SchedulePackageAppointmentDto,
    @Req() r: Request & { user: AuthenticatedUser },
  ) {
    return this.service.scheduleAppointment(id, dto, {
      secretaryId: r.user.personId,
    });
  }

  /**
   * Consultant schedules an appointment inside their package.
   */
  @Post(':id/my-appointments')
  @ApiParam({ name: 'id', description: 'Care package identifier.', type: Number })
  @Roles(UserRole.Requester)
  scheduleOwn(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SchedulePackageAppointmentDto,
    @Req() r: Request & { user: AuthenticatedUser },
  ) {
    return this.service.scheduleAppointment(id, dto, {
      requesterId: r.user.personId,
    });
  }

  /**
   * Lists up to 30 days of availability strictly for the treating psychologist
   * of a finalized care package so the consultant can schedule a new valuation.
   */
  @Get(':id/follow-up-valuation/availability')
  @ApiParam({
    name: 'id',
    description: 'Finalized care package identifier.',
    type: Number,
  })
  @Roles(UserRole.Requester)
  followUpValuationAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Query() q: CarePackageAvailabilityQueryDto,
    @Req() r: Request & { user: AuthenticatedUser },
  ) {
    return this.service.followUpValuationAvailability(
      id,
      r.user.personId,
      q,
    );
  }

  /**
   * Consultant schedules a new follow-up valuation strictly with the treating psychologist
   * of a finalized care package. Fails if the patient has an active or suggested care package
   * or an active valuation in progress.
   */
  @Post(':id/follow-up-valuation')
  @ApiParam({
    name: 'id',
    description: 'Finalized care package identifier.',
    type: Number,
  })
  @Roles(UserRole.Requester)
  scheduleFollowUpValuation(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ScheduleFollowUpValuationDto,
    @Req() r: Request & { user: AuthenticatedUser },
  ) {
    return this.service.scheduleFollowUpValuation(
      id,
      dto,
      r.user.personId,
    );
  }

  /**
   * Secretary finalizes a package.
   */
  @Patch(':id/finalize')
  @ApiParam({ name: 'id', description: 'Care package identifier.', type: Number })
  @Roles(UserRole.Secretary)
  finalize(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CloseCarePackageDto,
    @Req() r: Request & { user: AuthenticatedUser },
  ) {
    return this.service.close(id, 'finalizado', dto, r.user.personId);
  }

  /**
   * Secretary cancels a package.
   */
  @Patch(':id/cancel')
  @ApiParam({ name: 'id', description: 'Care package identifier.', type: Number })
  @Roles(UserRole.Secretary)
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CloseCarePackageDto,
    @Req() r: Request & { user: AuthenticatedUser },
  ) {
    return this.service.close(id, 'cancelado', dto, r.user.personId);
  }
}

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
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { OriginGuard } from '../guards/origin.guard.js';
import { RolesGuard } from '../guards/roles.guard.js';
import type { AuthenticatedUser } from '../auth/auth.interface.js';
import { Roles } from '../middlewares/roles.decorator.js';
import { UserRole } from '../models/user-role.enum.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateOwnProfileDto } from './dto/update-own-profile.dto.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UsersService } from './users.service.js';

const SELF_SERVICE_ROLES = [
  UserRole.Administrator,
  UserRole.Secretary,
  UserRole.Psychologist,
  UserRole.Marketing,
  UserRole.Requester,
];

/** Exposes protected endpoints for user administration and self-service profiles. */
@Controller('users')
@UseGuards(OriginGuard, JwtAuthGuard, RolesGuard)
@Roles(UserRole.Administrator)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @Roles(...SELF_SERVICE_ROLES)
  /** Returns the current authenticated user's profile. */
  getOwnProfile(@Req() request: Request & { user: AuthenticatedUser }) {
    return this.usersService.getOwnProfile(
      request.user.personId,
      request.user.roles,
    );
  }

  @Patch('me')
  @Roles(...SELF_SERVICE_ROLES)
  /** Updates the profile fields that the authenticated user may manage. */
  updateOwnProfile(
    @Req() request: Request & { user: AuthenticatedUser },
    @Body() dto: UpdateOwnProfileDto,
  ) {
    return this.usersService.updateOwnProfile(
      request.user.personId,
      request.user.roles,
      dto,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  /** Creates a user account on behalf of an administrator. */
  create(
    @Req() request: Request & { user: AuthenticatedUser },
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.create(dto, request.user.userId);
  }

  @Get()
  /** Lists users, optionally filtered by state or free-text search. */
  findAll(
    @Query('status') status?: 'active' | 'inactive',
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll({ status, search });
  }

  @Get(':id')
  /** Retrieves a user by its person identifier. */
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  /** Updates the administrator-managed fields of a user. */
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/status')
  /** Changes a user's account status and records the responsible administrator. */
  updateStatus(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(id, dto, request.user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  /** Removes a user and records the administrator who performed the action. */
  remove(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.remove(id, request.user.userId);
  }
}

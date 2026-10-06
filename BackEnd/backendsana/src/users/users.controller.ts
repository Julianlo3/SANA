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

@Controller('users')
@UseGuards(OriginGuard, JwtAuthGuard, RolesGuard)
@Roles(UserRole.Administrator)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @Roles(...SELF_SERVICE_ROLES)
  getOwnProfile(@Req() request: Request & { user: AuthenticatedUser }) {
    return this.usersService.getOwnProfile(
      request.user.personId,
      request.user.roles,
    );
  }

  @Patch('me')
  @Roles(...SELF_SERVICE_ROLES)
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
  create(
    @Req() request: Request & { user: AuthenticatedUser },
    @Body() dto: CreateUserDto,
  ) {
    return this.usersService.create(dto, request.user.userId);
  }

  @Get()
  findAll(
    @Query('status') status?: 'active' | 'inactive' | 'blocked',
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll({ status, search });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Req() request: Request & { user: AuthenticatedUser },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateStatus(id, dto, request.user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}

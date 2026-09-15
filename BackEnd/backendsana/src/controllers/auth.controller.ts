import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { OriginGuard } from '../guards/origin.guard.js';
import { RateLimitGuard } from '../guards/rate-limit.guard.js';
import type { AuthenticatedUser } from '../interfaces/auth.interface.js';
import { Section } from '../middlewares/section.decorator.js';

@Controller('auth')
@Section('Authentication Service')
@UseGuards(OriginGuard, RateLimitGuard)
export class AuthController {
  
  /** 
   * Validates the Auth0 Bearer token and returns the local SANA identity. 
  */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: Request & { user: AuthenticatedUser }) {
    return request.user;
  }

  /** 
   * Auth0 owns the browser session and token revocation. 
  */
  @Delete('sessions/current')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  logout(@Req() request: Request & { user: AuthenticatedUser }): void {
    void request.user;
  }
}

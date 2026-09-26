import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { OriginGuard } from '../guards/origin.guard.js';
import { RateLimitGuard } from '../guards/rate-limit.guard.js';
import type { AuthenticatedUser } from '../interfaces/auth.interface.js';
import { Section } from '../middlewares/section.decorator.js';
import { AuthService } from '../services/auth.service.js';

@Controller('auth')
@Section('Authentication Service')
@UseGuards(OriginGuard, RateLimitGuard)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /** 
   * Validates the Auth0 Bearer token and returns the local SANA identity. 
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: Request & { user: AuthenticatedUser }) {
    this.logger.log(
      `Module:auth, Function:me, result-success: userId-${request.user.userId}, email-${request.user.email}, roles-[${request.user.roles.join(',')}]`,
    );
    return request.user;
  }

  /** 
   * Records acceptance of platform terms and conditions by the authenticated user.
   */
  @Patch('terms')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async acceptTerms(@Req() request: Request & { user: AuthenticatedUser }) {
    this.logger.log(
      `Module:auth, Function:acceptTerms, result-start: userId-${request.user.userId}, personId-${request.user.personId}`,
    );
    await this.authService.acceptTerms(request.user.personId);
    return {
      message: 'Términos y condiciones aceptados correctamente',
      termsAccepted: true,
    };
  }

  /** 
   * Records acceptance of psychologist terms and conditions by an authenticated psychologist.
   */
  @Patch('psychologist-terms')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async acceptPsychologistTerms(
    @Req() request: Request & { user: AuthenticatedUser },
  ) {
    this.logger.log(
      `Module:auth, Function:acceptPsychologistTerms, result-start: userId-${request.user.userId}, personId-${request.user.personId}`,
    );
    await this.authService.acceptPsychologistTerms(request.user.personId);
    return {
      message: 'Términos y condiciones de psicólogo aceptados correctamente',
      psyTermsAccepted: true,
    };
  }

  /** 
   * Auth0 owns the browser session and token revocation. 
   */
  @Delete('sessions/current')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  logout(@Req() request: Request & { user: AuthenticatedUser }): void {
    this.logger.log(
      `Module:auth, Function:logout, result-success: userId-${request.user.userId}, email-${request.user.email}`,
    );
    void request.user;
  }
}

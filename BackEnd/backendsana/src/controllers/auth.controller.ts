import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import type { Request, Response } from 'express';
import { GoogleSignInDto } from '../dto/google-sign-in.dto.js';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import { OriginGuard } from '../guards/origin.guard.js';
import type { AuthenticatedUser } from '../interfaces/auth.interface.js';
import { AuthService } from '../services/auth.service.js';
import { GoogleIdentityService } from '../services/google-identity.service.js';

/**
 * Controller for handling authentication-related endpoints.
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleIdentityService: GoogleIdentityService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Creates a Google login nonce.
   * @param response The response object.
   * @returns The created nonce.
   */
  @Post('nonces')
  @UseGuards(OriginGuard)
  createGoogleNonce(@Res({ passthrough: true }) response: Response) {
    const nonce = randomUUID();
    response.cookie(
      this.googleNonceCookieName(),
      nonce,
      this.cookieOptions(300000),
    );
    console.log('Auth nonce = issued');
    return { nonce };
  }

  /**
   * Handles Google sign-in requests.
   * @param dto The Google sign-in DTO.
   * @param request The request object.
   * @param response The response object.
   * @returns The authentication tokens.
   */
  @Post('sessions')
  @UseGuards(OriginGuard)
  async googleSignIn(
    @Body() dto: GoogleSignInDto,
    @Req() request: Request & { cookies?: Record<string, string> },
    @Res({ passthrough: true }) response: Response,
  ) {
    const expectedNonce = request.cookies?.[this.googleNonceCookieName()];
    if (!expectedNonce || expectedNonce !== dto.nonce)
      throw new UnauthorizedException('Invalid Google login nonce');
    const profile = await this.googleIdentityService.verifyIdToken(
      dto.idToken,
      expectedNonce,
    );
    response.clearCookie(this.googleNonceCookieName(), this.cookieOptions());
    const tokens = await this.authService.signIn(profile);
    this.setRefreshCookie(response, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }
  
  /**
   * Refreshes the access token.
   * @param request The request object.
   * @param response The response object.
   * @returns The new authentication tokens.
   */
  @Post('access-tokens')
  @UseGuards(OriginGuard)
  async refresh(
    @Req() request: Request & { cookies?: Record<string, string> },
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.[this.refreshCookieName()];
    if (!refreshToken)
      throw new UnauthorizedException('Refresh token is required');
    const tokens = await this.authService.refresh(refreshToken);
    this.setRefreshCookie(response, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  /**
   * Logs out the current user.
   * @param request The request object.
   * @param response The response object.
   */
  @Delete('sessions/current')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(OriginGuard, JwtAuthGuard)
  async logout(
    @Req() request: Request & { user: AuthenticatedUser },
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(request.user.sessionId);
    response.clearCookie(this.refreshCookieName(), this.cookieOptions());
  }

  /**
   * Sets the refresh cookie.
   * @param response The response object.
   * @param refreshToken The refresh token.
   */
  private setRefreshCookie(response: Response, refreshToken: string): void {
    response.cookie(
      this.refreshCookieName(),
      refreshToken,
      this.cookieOptions(
        this.durationMilliseconds(
          this.configService.getOrThrow<string>('JWT_REFRESH_TTL'),
        ),
      ),
    );
  }

  /**
   * Returns the cookie options.
   * @param maxAge The maximum age of the cookie.
   * @returns The cookie options.
   */
  private cookieOptions(maxAge?: number) {
    return {
      httpOnly: true,
      secure: this.configService.getOrThrow<boolean>('COOKIE_SECURE'),
      sameSite: this.configService.getOrThrow<'lax' | 'strict' | 'none'>(
        'COOKIE_SAME_SITE',
      ),
      path: '/',
      maxAge,
    };
  }

  /**
   * Returns the name of the refresh cookie.
   * @returns The refresh cookie name.
   */
  private refreshCookieName(): string {
    return this.configService.getOrThrow<boolean>('COOKIE_SECURE')
      ? '__Host-sana-refresh'
      : 'sana-refresh';
  }

  /**
   * Returns the name of the Google nonce cookie.
   * @returns The Google nonce cookie name.
   */
  private googleNonceCookieName(): string {
    return this.configService.getOrThrow<boolean>('COOKIE_SECURE')
      ? '__Host-sana-google-nonce'
      : 'sana-google-nonce';
  }

  /**
   * Converts a duration string to milliseconds.
   * @param value The duration string.
   * @returns The duration in milliseconds.
   */
  private durationMilliseconds(value: string): number {
    const match = /^(\d+)([mhd])$/.exec(value);
    if (!match) throw new Error('Invalid token duration');
    const units = { m: 60000, h: 3600000, d: 86400000 };
    return Number(match[1]) * units[match[2] as keyof typeof units];
  }
}

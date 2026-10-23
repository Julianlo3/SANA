import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Query,
  Res,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Response } from 'express';
import { RateLimitGuard } from '../guards/rate-limit.guard.js';
import { RateLimit } from '../middlewares/rate-limit.decorator.js';

const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';
const STATE_TTL_MS = 10 * 60 * 1000;

@Controller('auth/google')
@UseGuards(RateLimitGuard)
export class GmailOAuthController {
  constructor(private readonly configService: ConfigService) {}

  /** Starts the one-time OAuth consent flow used to configure Gmail delivery. */
  @Get()
  @RateLimit({ limit: 5, windowSeconds: 300 })
  start(@Query('setup_key') setupKey: string) {
    const config = this.readConfig();
    this.assertSetupKey(setupKey, config.setupKey);
    const oauth = this.createClient(config);
    const expiresAt = Date.now() + STATE_TTL_MS;
    const nonce = randomBytes(24).toString('base64url');
    const state = `${expiresAt}.${nonce}.${this.signState(expiresAt, nonce, config.setupKey)}`;

    return {
      authorizationUrl: oauth.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        include_granted_scopes: true,
        scope: [GMAIL_SEND_SCOPE],
        state,
      }),
    };
  }

  /** Exchanges Google's one-time authorization code for a Gmail refresh token. */
  @Get('callback')
  @RateLimit({ limit: 10, windowSeconds: 300 })
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') oauthError: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (oauthError)
      throw new BadRequestException(
        `Google authorization failed: ${oauthError}`,
      );
    const config = this.readConfig();
    this.assertState(state, config.setupKey);
    if (!code)
      throw new BadRequestException(
        'Google did not return an authorization code',
      );

    let refreshToken: string | null | undefined;
    try {
      ({
        tokens: { refresh_token: refreshToken },
      } = await this.createClient(config).getToken(code));
    } catch {
      throw new BadRequestException(
        'The Google authorization code could not be exchanged',
      );
    }
    if (!refreshToken) {
      throw new ServiceUnavailableException(
        'Google did not return a refresh token. Revoke this app in the Google account and authorize again.',
      );
    }

    response.setHeader('Cache-Control', 'no-store, max-age=0');
    response.setHeader('Pragma', 'no-cache');
    return { refreshToken };
  }

  private readConfig() {
    const clientId = this.configService.get<string>('GMAIL_CLIENT_ID')?.trim();
    const clientSecret = this.configService
      .get<string>('GMAIL_CLIENT_SECRET')
      ?.trim();
    const redirectUri = this.configService
      .get<string>('GMAIL_REDIRECT_URI')
      ?.trim();
    const setupKey = this.configService
      .get<string>('GMAIL_OAUTH_SETUP_SECRET')
      ?.trim();
    if (!clientId || !clientSecret || !redirectUri || !setupKey) {
      throw new ServiceUnavailableException(
        'Gmail OAuth setup is not configured',
      );
    }
    return { clientId, clientSecret, redirectUri, setupKey };
  }

  private createClient(config: ReturnType<GmailOAuthController['readConfig']>) {
    return new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri,
    );
  }

  private assertSetupKey(provided: string | undefined, expected: string): void {
    if (!provided || !this.safeEqual(provided, expected)) {
      throw new ForbiddenException('Invalid Gmail OAuth setup key');
    }
  }

  private assertState(state: string | undefined, setupKey: string): void {
    const [expiresAtRaw, nonce, signature] = state?.split('.') ?? [];
    const expiresAt = Number(expiresAtRaw);
    if (
      !nonce ||
      !signature ||
      !Number.isSafeInteger(expiresAt) ||
      expiresAt < Date.now()
    ) {
      throw new ForbiddenException('Invalid or expired Gmail OAuth state');
    }
    const expected = this.signState(expiresAt, nonce, setupKey);
    if (!this.safeEqual(signature, expected))
      throw new ForbiddenException('Invalid Gmail OAuth state');
  }

  private signState(
    expiresAt: number,
    nonce: string,
    setupKey: string,
  ): string {
    return createHmac('sha256', setupKey)
      .update(`${expiresAt}.${nonce}`)
      .digest('base64url');
  }

  private safeEqual(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    return (
      leftBuffer.length === rightBuffer.length &&
      timingSafeEqual(leftBuffer, rightBuffer)
    );
  }
}

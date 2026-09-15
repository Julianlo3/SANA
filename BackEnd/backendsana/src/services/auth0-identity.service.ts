import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

export interface Auth0Profile {
  subject: string;
  email: string;
  name: string;
  isEmailVerified: boolean;
}

interface Auth0Claims extends JWTPayload {
  email?: string;
  name?: string;
  email_verified?: boolean;
  'https://sana.app/email'?: string;
  'https://sana.app/name'?: string;
  'https://sana.app/email_verified'?: boolean;
}

/**
 * Service for verifying Auth0 access tokens and extracting user profiles.
 */
@Injectable()
export class Auth0IdentityService {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(private readonly configService: ConfigService) {
    const domain = this.configService
      .getOrThrow<string>('AUTH0_DOMAIN')
      .replace(/\/$/, '');
    this.jwks = createRemoteJWKSet(
      new URL(`https://${domain}/.well-known/jwks.json`),
    );
  }

  /**
   * Verifies an Auth0 access token and extracts the user profile.
   * @param accessToken 
   * @returns 
   */
  async verifyAccessToken(accessToken: string): Promise<Auth0Profile> {
    try {
      const claimNamespace = this.configService
        .getOrThrow<string>('AUTH0_CLAIM_NAMESPACE')
        .replace(/\/$/, '');
      const issuer = `https://${this.configService
        .getOrThrow<string>('AUTH0_DOMAIN')
        .replace(/\/$/, '')}/`;
      const { payload } = await jwtVerify<Auth0Claims>(accessToken, this.jwks, {
        issuer,
        audience: this.configService.getOrThrow<string>('AUTH0_AUDIENCE'),
        algorithms: ['RS256'],
      });

      const emailClaim = payload[`${claimNamespace}/email`] ?? payload.email;
      const nameClaim = payload[`${claimNamespace}/name`] ?? payload.name;
      const emailVerifiedClaim =
        payload[`${claimNamespace}/email_verified`] ?? payload.email_verified;
      const email = typeof emailClaim === 'string' ? emailClaim : null;
      const name = typeof nameClaim === 'string' ? nameClaim : email;
      const emailVerified = emailVerifiedClaim === true;

      if (!payload.sub || !email || emailVerified !== true)
        throw new UnauthorizedException('Auth0 token lacks required claims');

      return {
        subject: payload.sub,
        email: email.trim().toLowerCase(),
        name: String(name),
        isEmailVerified: true,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid Auth0 access token');
    }
  }
}
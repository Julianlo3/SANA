import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import type { GoogleProfile } from '../interfaces/auth.interface.js';

@Injectable()
export class GoogleIdentityService {
  private readonly client = new OAuth2Client();

  constructor(private readonly configService: ConfigService) {}

  /**
   * Verifies a Google ID token and returns the corresponding user profile.
   * @param idToken The ID token to verify.
   * @param nonce The nonce to check against the token.
   * @returns A promise resolving to the verified Google profile.
   */
  async verifyIdToken(idToken: string, nonce: string): Promise<GoogleProfile> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.configService.getOrThrow('GOOGLE_CLIENT_ID'),
      });
      const payload = ticket.getPayload();
      if (
        !payload?.sub ||
        !payload.email ||
        payload.email_verified !== true ||
        payload.nonce !== nonce
      )
        throw new ForbiddenException('Google identity validation failed');
      console.log('Google identity = verified');
      return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name ?? payload.email,
        isEmailVerified: payload.email_verified,
      };
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new UnauthorizedException('Invalid Google ID token');
    }
  }
}

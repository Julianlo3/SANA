import { ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../interfaces/auth.interface.js';
import { AccountState } from '../models/account-state.enum.js';
import { UserRole } from '../models/user-role.enum.js';
import { AuthRepository } from '../repositories/auth.repository.js';
import type { Auth0Profile } from './auth0-identity.service.js';
import { SecurityLogService } from './security-log.service.js';

const ALLOWED_ROLES = new Set([
  UserRole.Administrator,
  UserRole.Secretary,
  UserRole.Psychologist,
  UserRole.Marketing,
]);

/**
 * Extracts the provider name from an Auth0 subject string.
 * @param subject  The Auth0 subject string.
 * @returns The provider name extracted from the subject.
 */
function extractProviderName(subject: string): string {
  const [strategy] = subject.split('|');
  return strategy;
}


/** 
 * Applies SANA account state and role authorization to an Auth0 identity. 
*/
@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly securityLogService: SecurityLogService,
  ) {}

  /**
   * Authorizes an Auth0 profile and returns the corresponding SANA user.
   * @param profile The Auth0 profile to authorize.
   * @returns The authorized SANA user.
   */
  async authorizeAuth0(profile: Auth0Profile): Promise<AuthenticatedUser> {
    const email = profile.email.trim().toLowerCase();
    const providerName = extractProviderName(profile.subject);

    let record = await this.repository.findByProviderId(profile.subject);

    if (!record) {
      record = await this.repository.findByEmail(email);
      if (!record) {
        await this.repository.createPending(email, profile.name);
        throw new ForbiddenException('Access request is pending');
      }

      if (!profile.isEmailVerified) {
        if (record.userId) {
          this.logDenied(
            record.userId,
            email,
            'unverified email attempted to claim/link an existing account',
          );
        }
        throw new ForbiddenException('Email must be verified with the identity provider');
      }

      if (!record.userId) {
        try {
          await this.repository.claim(record.personId, profile.subject, providerName, true);
        } catch (error) {
          if ((error as { code?: string }).code !== '23505') throw error;
        }
        record = await this.repository.findByProviderId(profile.subject);
      } else if (record.providerId !== profile.subject) {
        await this.repository.linkProvider(record.userId, profile.subject, providerName, true);
        record = await this.repository.findByProviderId(profile.subject);
      }
    }

    if (!record?.userId || record.providerId !== profile.subject)
      throw new ForbiddenException('Auth0 account does not match the local account');

    if (record.email.toLowerCase() !== email) {
      await this.repository.updateEmail(record.personId, email);
      record.email = email;
    }

    if (record.state !== AccountState.Active) {
      this.logDenied(record.userId, record.email, `account state '${record.state}'`);
      throw new ForbiddenException('Account is not active');
    }

    if (!record.roles.some((role) => ALLOWED_ROLES.has(role as UserRole))) {
      this.logDenied(record.userId, record.email, 'no authorized role');
      throw new ForbiddenException('Account role is not authorized');
    }

    await this.repository.updateLastLogin(record.userId);
    return {
      userId: record.userId,
      personId: record.personId,
      email: record.email,
      roles: record.roles,
      auth0Subject: profile.subject,
    };
  }

  

  async authenticateAuth0(profile: Auth0Profile): Promise<AuthenticatedUser> {
    return this.authorizeAuth0(profile);
  }

  private logDenied(userId: number, email: string, reason: string): void {
    this.securityLogService
      .logUnauthorizedAccess({
        userId,
        section: 'Auth0 Sign-In',
        message: `Auth0 user ${email} denied: ${reason}.`,
      })
      .catch(() => undefined);
  }
 
}

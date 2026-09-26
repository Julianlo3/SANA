import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
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
 * Applies SANA account state and role authorization to an Auth0 identity.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly repository: AuthRepository,
    private readonly securityLogService: SecurityLogService,
  ) {}

  /**
   * Authorizes an Auth0 profile by checking account state and roles, and returns the corresponding authenticated user.
   * @param profile the Auth0 profile to authorize.
   * @returns the authenticated user corresponding to the authorized Auth0 profile.
   */
  async authorizeAuth0(profile: Auth0Profile): Promise<AuthenticatedUser> {
    const email = profile.email.trim().toLowerCase();
    const providerName = this.extractProviderName(profile.subject);

    this.logger.log(
      `Module:auth, Function:authorizeAuth0, result-start: email-${email}, provider-${providerName}`,
    );

    let record = await this.repository.findByProviderId(profile.subject);

    if (!record) {
      record = await this.repository.findByEmail(email);
      if (!record) {
        this.logger.warn(
          `Module:auth, Function:authorizeAuth0, result-denied: email-${email}, reason-account_not_found`,
        );
        throw new ForbiddenException('Account not found. Contact an administrator.');
      }

      if (!profile.isEmailVerified) {
        if (record.userId) {
          this.logDenied(
            record.userId,
            email,
            'unverified email attempted to claim/link an existing account',
          );
        }
        this.logger.warn(
          `Module:auth, Function:authorizeAuth0, result-denied: email-${email}, reason-email_not_verified`,
        );
        throw new ForbiddenException('Email must be verified with the identity provider');
      }

      if (
        record.roles.length > 0 &&
        !record.roles.some((role) => ALLOWED_ROLES.has(role as UserRole))
      ) {
        if (record.userId) {
          this.logDenied(record.userId, email, 'no authorized role (pre-claim check)');
        }
        this.logger.warn(
          `Module:auth, Function:authorizeAuth0, result-denied: email-${email}, reason-no_authorized_role_pre_claim`,
        );
        throw new ForbiddenException('Account role is not authorized');
      }

      if (!record.userId) {
        this.logger.log(
          `Module:auth, Function:authorizeAuth0, result-claim-attempt: email-${email}, personId-${record.personId}`,
        );
        try {
          await this.repository.claim(record.personId, profile.subject, providerName, true);
          this.logger.log(
            `Module:auth, Function:authorizeAuth0, result-claim-success: email-${email}, personId-${record.personId}`,
          );
        } catch (error) {
          if ((error as { code?: string }).code !== '23505') throw error;
          this.logger.warn(
            `Module:auth, Function:authorizeAuth0, result-claim-duplicate: email-${email}, personId-${record.personId} (race condition 23505, continuing)`,
          );
        }
        record = await this.repository.findByProviderId(profile.subject);
      } else if (record.providerId !== profile.subject) {
        this.logger.log(
          `Module:auth, Function:authorizeAuth0, result-link-provider: email-${email}, userId-${record.userId}, provider-${providerName}`,
        );
        await this.repository.linkProvider(record.userId, profile.subject, providerName, true);
        record = await this.repository.findByProviderId(profile.subject);
      }
    }

    if (!record?.userId || record.providerId !== profile.subject)
      throw new ForbiddenException('Auth0 account does not match the local account');

    if (record.email.toLowerCase() !== email) {
      this.logger.log(
        `Module:auth, Function:authorizeAuth0, result-email-update: personId-${record.personId}, old-${record.email}, new-${email}`,
      );
      await this.repository.updateEmail(record.personId, email);
      record.email = email;
    }

    if (record.state !== AccountState.Active) {
      this.logDenied(record.userId, record.email, `account state '${record.state}'`);
      this.logger.warn(
        `Module:auth, Function:authorizeAuth0, result-denied: email-${record.email}, userId-${record.userId}, reason-state_${record.state}`,
      );
      throw new ForbiddenException('Account is not active');
    }

    if (
      record.roles.length > 0 &&
      !record.roles.some((role) => ALLOWED_ROLES.has(role as UserRole))
    ) {
      this.logDenied(record.userId, record.email, 'no authorized role');
      this.logger.warn(
        `Module:auth, Function:authorizeAuth0, result-denied: email-${record.email}, userId-${record.userId}, reason-no_authorized_role`,
      );
      throw new ForbiddenException('Account role is not authorized');
    }

    await this.repository.updateLastLogin(record.userId);

    this.logger.log(
      `Module:auth, Function:authorizeAuth0, result-success: email-${record.email}, userId-${record.userId}, personId-${record.personId}, roles-[${record.roles.join(',')}], state-${record.state}`,
    );

    return {
      userId: record.userId,
      personId: record.personId,
      email: record.email,
      roles: record.roles,
      auth0Subject: profile.subject,
      state: record.state,
      termsAccepted: record.termsAccepted ?? false,
      psyTermsAccepted: record.psyTermsAccepted ?? null,
    };
  }

  /**
   * Authenticates an Auth0 profile and returns the corresponding authenticated user.
   * @param profile The Auth0 profile to authenticate.
   * @returns A promise resolving to the authenticated user.
   */
  async authenticateAuth0(profile: Auth0Profile): Promise<AuthenticatedUser> {
    return this.authorizeAuth0(profile);
  }

  /**
   * Records acceptance of platform terms and conditions by a person.
   * @param personId The ID of the person.
   */
  async acceptTerms(personId: number): Promise<void> {
    await this.repository.acceptTerms(personId);
    this.logger.log(
      `Module:auth, Function:acceptTerms, result-success: personId-${personId}`,
    );
  }

  /**
   * Records acceptance of psychologist terms and conditions.
   * @param psychologistId The ID of the psychologist.
   */
  async acceptPsychologistTerms(psychologistId: number): Promise<void> {
    await this.repository.acceptPsychologistTerms(psychologistId);
    this.logger.log(
      `Module:auth, Function:acceptPsychologistTerms, result-success: psychologistId-${psychologistId}`,
    );
  }

  /**
   * Logs a denied access attempt.
   * @param userId  user ID of the user attempting access
   * @param email email of the user attempting access
   * @param reason the reason for the denial
   */
  private logDenied(userId: number, email: string, reason: string): void {
    this.securityLogService
      .logUnauthorizedAccess({
        userId,
        section: 'Auth0 Sign-In',
        message: `Auth0 user ${email} denied: ${reason}.`,
      })
      .catch(() => undefined);
  }

  /**
   * Extracts the provider name from an Auth0 subject string.
   * @param subject The Auth0 subject string.
   * @returns The provider name.
   */
  private extractProviderName(subject: string): string {
    const [strategy] = subject.split('|');
    return strategy;
  }
}
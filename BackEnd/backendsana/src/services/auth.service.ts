import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'crypto';
import { DataSource, EntityManager } from 'typeorm';
import type {
  AuthenticatedUser,
  GoogleProfile,
  JwtPayload,
  TokenPair,
} from '../interfaces/auth.interface.js';
import { AccountState } from '../models/account-state.enum.js';
import { UserRole } from '../models/user-role.enum.js';
import { AuthRepository } from '../repositories/auth.repository.js';
import { SecurityLogService } from './security-log.service.js';

const ALLOWED_ROLES = new Set([
  UserRole.Administrator,
  UserRole.Secretary,
  UserRole.Psychologist,
  UserRole.Marketing,
]);

/**
 * Service for handling authentication and session lifecycle logic.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly securityLogService: SecurityLogService,
  ) { }

  /**
   * Authenticates a user based on their Google profile.
   * @param profile The Google profile of the user.
   * @returns A promise resolving to the token pair.
   */
  async signIn(profile: GoogleProfile): Promise<TokenPair> {
    if (!profile.isEmailVerified)
      throw new ForbiddenException('Google email is not verified');
    const email = profile.email.trim().toLowerCase();

    let record = await this.repository.findByProviderId(
      profile.googleId,
      'google',
    );

    if (record) {
      if (record.email.toLowerCase() !== email) {
        await this.repository.updateEmail(record.personId, email);
        record.email = email;
      }
    } else {
      record = await this.repository.findByEmail(email);
      if (!record) {
        await this.repository.createPending(email, profile.name);
        console.log('Access request = pending');
        throw new ForbiddenException('Access request is pending');
      }

      if (!record.userId) {
        try {
          await this.repository.claim(record.personId, profile.googleId);
          console.log('Account claim = completed');
        } catch (error) {
          if ((error as { code?: string }).code !== '23505') throw error;
        }
        record = await this.repository.findByProviderId(
          profile.googleId,
          'google',
        );
      }
    }

    if (!record?.userId || record.providerId !== profile.googleId)
      throw new UnauthorizedException(
        'Google account does not match the claimed account',
      );

    if (record.state !== AccountState.Active) {
      this.securityLogService
        .logUnauthorizedAccess({
          userId: record.userId,
          section: 'OAuth Sign-In',
          message: `User ${record.email} with state '${record.state}' attempted to sign in.`,
        })
        .catch((err) => console.error('Failed to log security incident:', err));
      throw new ForbiddenException('Account is not active');
    }

    if (!record.roles.some((role) => ALLOWED_ROLES.has(role as UserRole))) {
      this.securityLogService
        .logUnauthorizedAccess({
          userId: record.userId,
          section: 'OAuth Sign-In',
          message: `User ${record.email} without authorized roles [${record.roles.join(', ') || 'None'}] attempted to sign in.`,
        })
        .catch((err) => console.error('Failed to log security incident:', err));
      throw new ForbiddenException('Account role is not authorized');
    }

    await this.repository.updateLastLogin(record.userId);
    return this.createSession(record);
  }

  /**
   * Refreshes an authentication token using Refresh Token Rotation (RTR)
   * with automatic reuse detection.
   * @param refreshToken The composite refresh token (`${sessionId}.${secret}`).
   * @returns A promise resolving to the new token pair.
   */
  async refresh(refreshToken: string): Promise<TokenPair> {
    const dotIndex = refreshToken.indexOf('.');
    if (dotIndex === -1)
      throw new UnauthorizedException('Invalid refresh token format');

    const sessionId = refreshToken.substring(0, dotIndex);
    const tokenSecret = refreshToken.substring(dotIndex + 1);
    if (!sessionId || !tokenSecret)
      throw new UnauthorizedException('Invalid refresh token');

    const incomingHash = this.hashToken(tokenSecret);

    return this.dataSource.transaction(async (manager) => {
      const rows = await manager.query(
        `SELECT auth_session_id, use_id, auth_session_refresh_token_hash,
                auth_session_previous_token_hash, auth_session_expires_at,
                auth_session_revoked_at, auth_session_last_activity_at
           FROM auth_sessions
          WHERE auth_session_id = $1
            FOR UPDATE`,
        [sessionId],
      );

      const session = rows[0];
      if (!session) throw new UnauthorizedException('Invalid refresh token');

      if (session.auth_session_revoked_at !== null)
        throw new UnauthorizedException('Session has been revoked');

      const now = new Date();
      if (new Date(session.auth_session_expires_at) <= now) {
        await manager.query(
          `UPDATE auth_sessions
              SET auth_session_revoked_at = now(),
                  auth_session_revoked_reason = 'expired'
            WHERE auth_session_id = $1`,
          [sessionId],
        );
        throw new UnauthorizedException('Session expired');
      }

      const idleLimitMinutes = this.configService.getOrThrow<number>(
        'SESSION_IDLE_TTL_MINUTES',
      );
      const lastActivity = new Date(session.auth_session_last_activity_at);
      if (now.getTime() - lastActivity.getTime() > idleLimitMinutes * 60 * 1000) {
        await manager.query(
          `UPDATE auth_sessions
              SET auth_session_revoked_at = now(),
                  auth_session_revoked_reason = 'expired'
            WHERE auth_session_id = $1`,
          [sessionId],
        );
        throw new UnauthorizedException('Session idle timeout');
      }

      if (
        this.compareHashes(
          incomingHash,
          session.auth_session_refresh_token_hash,
        )
      ) {
        const record = await this.ensureActive(session.use_id, sessionId);
        const newSecret = randomBytes(32).toString('base64url');
        const newHash = this.hashToken(newSecret);

        await manager.query(
          `UPDATE auth_sessions
              SET auth_session_previous_token_hash = auth_session_refresh_token_hash,
                  auth_session_refresh_token_hash = $1,
                  auth_session_last_activity_at = now()
            WHERE auth_session_id = $2`,
          [newHash, sessionId],
        );

        const accessToken = await this.generateAccessToken({
          sub: record.userId as number,
          personId: record.personId,
          email: record.email,
          roles: record.roles,
          sessionId,
          tokenType: 'access',
        });

        console.log('Auth session = rotated');
        return {
          accessToken,
          refreshToken: `${sessionId}.${newSecret}`,
        };
      }

      if (
        session.auth_session_previous_token_hash &&
        this.compareHashes(
          incomingHash,
          session.auth_session_previous_token_hash,
        )
      ) {
        await manager.query(
          `UPDATE auth_sessions
              SET auth_session_revoked_at = now(),
                  auth_session_revoked_reason = 'reuse_detected'
            WHERE auth_session_id = $1`,
          [sessionId],
        );

        this.securityLogService
          .logUnauthorizedAccess({
            userId: session.use_id,
            sessionId,
            section: 'auth/refresh',
            message: 'Refresh token reuse detected. Session revoked.',
          })
          .catch((err) => {
            console.error('Failed to log token reuse incident:', err);
          });

        console.warn(
          `Auth session = revoked (reuse detected) for session ${sessionId}`,
        );
        throw new UnauthorizedException('Refresh token reuse detected');
      }

      throw new UnauthorizedException('Invalid refresh token');
    });
  }

  /**
   * Authenticates a user based on their access token.
   * @param accessToken The access token to use.
   * @returns A promise resolving to the authenticated user information.
   */
  async authenticate(accessToken: string): Promise<AuthenticatedUser> {
    const payload = await this.verifyAccessToken(accessToken);
    const session = await this.getActiveSession(payload.sessionId);
    if (!session) throw new UnauthorizedException('Session expired or revoked');

    const record = await this.ensureActive(payload.sub, payload.sessionId);
    await this.dataSource.query(
      'UPDATE auth_sessions SET auth_session_last_activity_at=now() WHERE auth_session_id=$1',
      [payload.sessionId],
    );

    return {
      userId: payload.sub,
      personId: record.personId,
      email: record.email,
      roles: record.roles,
      sessionId: payload.sessionId,
    };
  }

  /**
   * Logs out a user by revoking their authentication session.
   * @param sessionId The ID of the session to revoke.
   */
  async logout(sessionId: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE auth_sessions
          SET auth_session_revoked_at = now(),
              auth_session_revoked_reason = 'logout'
        WHERE auth_session_id = $1
          AND auth_session_revoked_at IS NULL`,
      [sessionId],
    );
    console.log('Auth session = revoked (logout)');
  }

  /**
   * Hashes a raw token secret using HMAC-SHA256 with the server pepper.
   * @param secret The plain token secret.
   * @returns The hex-encoded HMAC hash.
   */
  private hashToken(secret: string): string {
    const pepper =
      this.configService.get<string>('AUTH_TOKEN_PEPPER') ??
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    return createHmac('sha256', pepper).update(secret).digest('hex');
  }

  /**
   * Performs constant-time comparison of two hex hashes to prevent timing attacks.
   * @param a Hex hash string A.
   * @param b Hex hash string B.
   * @returns True if hashes are identical.
   */
  private compareHashes(a?: string | null, b?: string | null): boolean {
    if (!a || !b) return false;
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  }

  /**
   * Creates a new authentication session with an opaque refresh token.
   * @param record The user record for which to create a session.
   * @param manager The entity manager to use.
   * @returns A promise resolving to the token pair.
   */
  private async createSession(
    record: {
      userId: number | null;
      personId: number;
      email: string;
      roles: string[];
    },
    manager: EntityManager = this.dataSource.manager,
  ): Promise<TokenPair> {
    const sessionId = randomUUID();
    const refreshTtl = this.configService.getOrThrow<string>('JWT_REFRESH_TTL');
    const secret = randomBytes(32).toString('base64url');
    const tokenHash = this.hashToken(secret);
    const expiresAt = new Date(
      Date.now() + this.durationMilliseconds(refreshTtl),
    );

    await manager.query(
      `INSERT INTO auth_sessions (
         auth_session_id,
         use_id,
         auth_session_refresh_token_hash,
         auth_session_previous_token_hash,
         auth_session_expires_at,
         auth_session_last_activity_at
       ) VALUES ($1, $2, $3, NULL, $4, now())`,
      [sessionId, record.userId, tokenHash, expiresAt],
    );

    const accessToken = await this.generateAccessToken({
      sub: record.userId as number,
      personId: record.personId,
      email: record.email,
      roles: record.roles,
      sessionId,
      tokenType: 'access',
    });

    console.log('Auth session = created');
    return {
      accessToken,
      refreshToken: `${sessionId}.${secret}`,
    };
  }

  /**
   * Generates a signed JWT access token with strict standard claims.
   * @param payload The payload to include in the access token.
   * @returns A promise resolving to the signed access token string.
   */
  private async generateAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.getOrThrow<string>(
        'JWT_ACCESS_TTL',
      ) as never,
      issuer: this.configService.getOrThrow<string>('JWT_ISSUER'),
      audience: this.configService.getOrThrow<string>('JWT_AUDIENCE'),
      algorithm: 'HS256',
    });
  }

  /**
   * Verifies an access token JWT with strict standard claim validation.
   * @param token The JWT access token.
   * @returns The verified JWT payload.
   */
  private async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        issuer: this.configService.getOrThrow<string>('JWT_ISSUER'),
        audience: this.configService.getOrThrow<string>('JWT_AUDIENCE'),
        algorithms: ['HS256'],
      });
      if (payload.tokenType !== 'access') throw new Error();
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  /**
   * Retrieves an active authentication session by ID.
   * @param sessionId The ID of the session.
   * @returns The active session row or null.
   */
  private async getActiveSession(
    sessionId: string,
  ): Promise<Record<string, unknown> | null> {
    const idleLimitMinutes = this.configService.getOrThrow<number>(
      'SESSION_IDLE_TTL_MINUTES',
    );
    const rows = await this.dataSource.query(
      `SELECT * FROM auth_sessions
        WHERE auth_session_id = $1
          AND auth_session_revoked_at IS NULL
          AND auth_session_expires_at > now()
          AND auth_session_last_activity_at + ($2 * interval '1 minute') > now()`,
      [sessionId, idleLimitMinutes],
    );
    return rows[0] ?? null;
  }

  /**
   * Ensures that a user is active and has allowed roles.
   * @param userId The ID of the user to check.
   * @param sessionId Optional active session ID for security logging.
   * @returns A promise resolving to the user record if active and authorized.
   */
  private async ensureActive(userId: number, sessionId?: string | null) {
    const record = await this.repository.findByUserId(userId);
    if (!record || record.state !== AccountState.Active) {
      this.securityLogService
        .logUnauthorizedAccess({
          userId,
          sessionId,
          section: 'Session Authorization',
          message: `Inactive user account ${record?.email ?? userId} attempted operation.`,
        })
        .catch((err) => console.error('Failed to log security incident:', err));
      throw new ForbiddenException('Account is not active');
    }

    if (!record.roles.some((role) => ALLOWED_ROLES.has(role as UserRole))) {
      this.securityLogService
        .logUnauthorizedAccess({
          userId,
          sessionId,
          section: 'Session Authorization',
          message: `User ${record.email} without authorized roles [${record.roles.join(', ') || 'None'}] attempted operation.`,
        })
        .catch((err) => console.error('Failed to log security incident:', err));
      throw new ForbiddenException('Account role is not authorized');
    }

    return record;
  }

  /**
   * Converts a duration string to milliseconds.
   * @param value The duration string to convert.
   * @returns The duration in milliseconds.
   */
  private durationMilliseconds(value: string): number {
    const match = /^(\d+)([mhd])$/.exec(value);
    if (!match) throw new Error('Invalid token duration');
    const units = { m: 60000, h: 3600000, d: 86400000 };
    return Number(match[1]) * units[match[2] as keyof typeof units];
  }
}

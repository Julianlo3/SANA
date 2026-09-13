import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
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

const ALLOWED_ROLES = new Set([
  UserRole.Administrator,
  UserRole.Secretary,
  UserRole.Psychologist,
  UserRole.Marketing,
]);

/**
 * Service for handling authentication-related logic.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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

    if (record.state !== AccountState.Active)
      throw new ForbiddenException('Account is not active');
    if (!record.roles.some((role) => ALLOWED_ROLES.has(role as UserRole)))
      throw new ForbiddenException('Account role is not authorized');

    return this.createSession(record);
  }

  /**
   * Refreshes an authentication token.
   * @param refreshToken The refresh token to use.
   * @returns A promise resolving to the new token pair.
   */
  async refresh(refreshToken: string): Promise<TokenPair> {
    const payload = await this.verify(refreshToken, 'refresh');
    return this.dataSource.transaction(async (manager) => {
      const session = await this.getSession(payload.sessionId, manager, true);
      if (
        !session ||
        !(await bcrypt.compare(
          refreshToken,
          String(session.auth_session_refresh_token_hash),
        ))
      )
        throw new UnauthorizedException('Invalid refresh token');
      const record = await this.ensureActive(payload.sub);
      await manager.query(
        'UPDATE auth_sessions SET auth_session_revoked_at=now() WHERE auth_session_id=$1',
        [payload.sessionId],
      );
      const tokens = await this.createSession(record, manager);
      console.log('Auth session = refreshed');
      return tokens;
    });
  }

  /** 
   * Authenticates a user based on their access token.
   * @param accessToken The access token to use.
   * @returns A promise resolving to the authenticated user information.
   */
  async authenticate(accessToken: string): Promise<AuthenticatedUser> {
    const payload = await this.verify(accessToken, 'access');
    if (!(await this.getSession(payload.sessionId)))
      throw new UnauthorizedException('Session expired');
    const record = await this.ensureActive(payload.sub);
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
      'UPDATE auth_sessions SET auth_session_revoked_at=now() WHERE auth_session_id=$1 AND auth_session_revoked_at IS NULL',
      [sessionId],
    );
    console.log('Auth session = revoked');
  }

  /**
   * Creates a new authentication session.
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
    const payload: JwtPayload = {
      sub: record.userId as number,
      personId: record.personId,
      email: record.email,
      roles: record.roles,
      sessionId,
      tokenType: 'refresh',
    };
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
      expiresIn: refreshTtl as never,
    });
    await manager.query(
      'INSERT INTO auth_sessions (auth_session_id,use_id,auth_session_refresh_token_hash,auth_session_expires_at) VALUES ($1,$2,$3,$4)',
      [
        sessionId,
        record.userId,
        await bcrypt.hash(refreshToken, 12),
        new Date(Date.now() + this.durationMilliseconds(refreshTtl)),
      ],
    );
    const accessToken = await this.jwtService.signAsync(
      { ...payload, tokenType: 'access' },
      {
        secret: this.configService.getOrThrow('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.getOrThrow<string>(
          'JWT_ACCESS_TTL',
        ) as never,
      },
    );
    console.log('Auth session = created');
    return { accessToken, refreshToken };
  }

  /**
   * Verifies a JWT token and returns its payload.
   * @param token The token to verify.
   * @param tokenType The type of the token to verify.
   * @returns A promise resolving to the verified payload.
   */
  private async verify(
    token: string,
    tokenType: JwtPayload['tokenType'],
  ): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow(
          tokenType === 'access' ? 'JWT_ACCESS_SECRET' : 'JWT_REFRESH_SECRET',
        ),
      });
      if (payload.tokenType !== tokenType) throw new Error();
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Retrieves an authentication session by its ID.
   * @param sessionId The ID of the session to retrieve.
   * @param manager The entity manager to use.
   * @param shouldLock Whether to lock the session row for update.
   * @returns A promise resolving to the session record or null if not found.
   */
  private async getSession(
    sessionId: string,
    manager: EntityManager = this.dataSource.manager,
    shouldLock = false,
  ): Promise<Record<string, unknown> | null> {
    const lockClause = shouldLock ? ' FOR UPDATE' : '';
    const rows = await manager.query(
      `SELECT * FROM auth_sessions WHERE auth_session_id=$1 AND auth_session_revoked_at IS NULL AND auth_session_expires_at>now() AND auth_session_last_activity_at + ($2 * interval '1 minute') > now()${lockClause}`,
      [sessionId, this.configService.getOrThrow('SESSION_IDLE_TTL_MINUTES')],
    );
    return rows[0] ?? null;
  }

  /**
   * Ensures that a user is active and has allowed roles.
   * @param userId The ID of the user to check.
   * @returns A promise resolving to the user record if they are active and have allowed roles.
   */
  private async ensureActive(userId: number) {
    const record = await this.repository.findByUserId(userId);
    if (
      !record ||
      record.state !== AccountState.Active ||
      !record.roles.some((role) => ALLOWED_ROLES.has(role as UserRole))
    )
      throw new ForbiddenException('Account is not authorized');
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

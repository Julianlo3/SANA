import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Represents an authentication session for a user.
 */
@Entity({ name: 'auth_sessions' })
export class AuthSession {
  @PrimaryColumn({ name: 'auth_session_id', type: 'uuid' }) id: string;
  @Column({ name: 'use_id' }) userId: number;
  @Column({ name: 'auth_session_refresh_token_hash' }) refreshTokenHash: string;
  @Column({ name: 'auth_session_last_activity_at', type: 'timestamptz' })
  lastActivityAt: Date;
  @Column({ name: 'auth_session_expires_at', type: 'timestamptz' })
  expiresAt: Date;
  @Column({
    name: 'auth_session_revoked_at',
    type: 'timestamptz',
    nullable: true,
  })
  revokedAt: Date | null;
}

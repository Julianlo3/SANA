import { Column, Entity, PrimaryColumn } from 'typeorm';

export type RevocationReason =
  | 'logout'
  | 'rotated'
  | 'reuse_detected'
  | 'expired'
  | 'admin';

/**
 * Represents an authentication session for a user.
 */
@Entity({ name: 'auth_sessions' })
export class AuthSession {
  @PrimaryColumn({ name: 'auth_session_id', type: 'uuid' })
  id: string;

  @Column({ name: 'use_id' })
  userId: number;

  @Column({ name: 'auth_session_refresh_token_hash' })
  refreshTokenHash: string;

  @Column({
    name: 'auth_session_previous_token_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  previousTokenHash: string | null;

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

  @Column({
    name: 'auth_session_revoked_reason',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  revokedReason: RevocationReason | null;

  @Column({
    name: 'auth_session_created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}

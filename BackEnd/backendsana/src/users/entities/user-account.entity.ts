import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Tabla `users`: persona que ya reclamo su cuenta OAuth (inicio sesion al menos una vez). */
@Entity({ name: 'users' })
export class UserAccount {
  @PrimaryColumn({ name: 'use_id' })
  useId!: number;

  @Column({ name: 'user_provider_id', length: 255 })
  userProviderId!: string;

  @Column({ name: 'user_provider_name', length: 25 })
  userProviderName!: string;

  @Column({ name: 'user_last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;

  @Column({ name: 'user_email_verified', type: 'boolean', default: false })
  emailVerified!: boolean;
}

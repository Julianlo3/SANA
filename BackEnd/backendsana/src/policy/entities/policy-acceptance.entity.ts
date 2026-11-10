import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { AcceptanceChannel } from '../acceptance-channel.js';

/**
 * Entity for policy acceptance
 */
@Entity({ name: 'policy_acceptance' })
export class PolicyAcceptance {
  @PrimaryGeneratedColumn({ name: 'pa_id' })
  paId!: number;

  @Column({ name: 'per_id' })
  perId!: number;

  @Column({ name: 'dep_id', type: 'integer', nullable: true })
  depId?: number | null;

  @Column({ name: 'cn_id', type: 'integer', nullable: true })
  cnId?: number | null;

  @Column({ name: 'pd_id' })
  pdId!: number;

  @Column({ name: 'pa_accepted_at', type: 'timestamptz', default: () => 'now()' })
  paAcceptedAt!: Date;

  @Column({ name: 'pa_ip_address', type: 'varchar', length: 50, nullable: true })
  paIpAddress?: string | null;

  @Column({ name: 'app_id', type: 'integer', nullable: true })
  appId?: number | null;

  @Column({ name: 'pa_channel', type: 'varchar', length: 15, default: 'web' })
  paChannel!: AcceptanceChannel;

  @Column({ name: 'pa_registered_by', type: 'integer', nullable: true })
  paRegisteredBy?: number | null;
}

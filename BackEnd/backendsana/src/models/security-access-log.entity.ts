import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Table `security_access_log`: records security-relevant events.
 */
@Entity({ name: 'security_access_log' })
export class SecurityAccessLog {
  @PrimaryGeneratedColumn({ name: 'security_access_log_id' })
  id!: number;

  @Column({ name: 'use_id' })
  userId!: number;

  @Column({
    name: 'security_access_log_section',
    type: 'varchar',
    length: 100,
  })
  section!: string;

  @Column({
    name: 'security_access_log_message',
    type: 'varchar',
    length: 255,
  })
  message!: string;

  @Column({
    name: 'security_access_log_created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;
}

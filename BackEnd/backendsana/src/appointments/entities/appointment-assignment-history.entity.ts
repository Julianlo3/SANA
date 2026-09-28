import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Entity for storing appointment assignment history
 */
@Entity({ name: 'appointment_assignment_history' })
export class AppointmentAssignmentHistory {
  @PrimaryGeneratedColumn({ name: 'aah_id' })
  aahId!: number;

  @Column({ name: 'app_id', type: 'integer' })
  appId!: number;

  @Column({ name: 'old_psy_id', type: 'integer', nullable: true })
  oldPsyId!: number | null;

  @Column({ name: 'new_psy_id', type: 'integer' })
  newPsyId!: number;

  @Column({ name: 'sec_id', type: 'integer' })
  secId!: number;

  @Column({ name: 'aah_changed_at', type: 'timestamptz', default: () => 'now()' })
  aahChangedAt!: Date;

  @Column({ name: 'aah_reason', type: 'varchar', length: 255, nullable: true })
  aahReason!: string | null;
}

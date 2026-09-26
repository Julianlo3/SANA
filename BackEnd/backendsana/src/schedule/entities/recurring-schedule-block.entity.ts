import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Entity representing a recurring schedule block for a psychologist, including the day of the week, start and end times, validity period, and reason for unavailability.
 */
@Entity({ name: 'schedule_recurring_blocks' })
export class RecurringScheduleBlock {
  @PrimaryGeneratedColumn({ name: 'srb_id' })
  id!: number;

  @Column({ name: 'psy_id' })
  psychologistId!: number;

  @Column({ name: 'srb_day_of_week', type: 'smallint' })
  dayOfWeek!: number;

  @Column({ name: 'srb_start_time', type: 'time' })
  startTime!: string;

  @Column({ name: 'srb_end_time', type: 'time' })
  endTime!: string;

  @Column({ name: 'srb_valid_from', type: 'date' })
  validFrom!: string;

  @Column({ name: 'srb_valid_until', type: 'date', nullable: true })
  validUntil!: string | null;

  @Column({ name: 'srb_reason', type: 'varchar', length: 255, nullable: true })
  reason!: string | null;

  @Column({ name: 'srb_active', type: 'boolean', default: true })
  active!: boolean;
}

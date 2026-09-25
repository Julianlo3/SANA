import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** Psychologist schedule blocks and appointment-occupied time slots. */
@Entity({ name: 'schedule' })
export class Schedule {
  @PrimaryGeneratedColumn({ name: 'sch_id' })
  scheduleId!: number;

  @Column({ name: 'psy_id' })
  psychologistUserId!: number;

  @Column({ name: 'app_id', type: 'integer', nullable: true })
  appointmentId!: number | null;

  @Column({ name: 'sch_date', type: 'date' })
  date!: string;

  @Column({ name: 'sch_start_time', type: 'time' })
  startTime!: string;

  @Column({ name: 'sch_end_time', type: 'time' })
  endTime!: string;

  @Column({ name: 'sch_reason', type: 'varchar', length: 255, nullable: true })
  reason!: string | null;
}

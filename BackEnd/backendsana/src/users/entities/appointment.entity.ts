import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type AppointmentState =
  | 'pendiente'
  | 'asignada'
  | 'confirmada'
  | 'descartada'
  | 'cancelada'
  | 'realizada';
export type AppointmentType = 'presencial' | 'virtual';

/** 
 * Map to table appointments in the database
 */
@Entity({ name: 'appointments' })
export class Appointment {
  @PrimaryGeneratedColumn({ name: 'app_id' })
  appId!: number;

  @Column({ name: 'psy_id', type: 'integer', nullable: true })
  psychologistUserId!: number | null;

  @Column({ name: 'sec_id', type: 'integer', nullable: true })
  secretaryUserId!: number | null;

  @Column({ name: 'req_id' })
  requesterPersonId!: number;

  @Column({ name: 'app_patient_person_id', type: 'integer', nullable: true })
  patientPersonId!: number | null;

  @Column({ name: 'app_patient_dependent_id', type: 'integer', nullable: true })
  patientDependentId!: number | null;

  @Column({ name: 'app_date', type: 'timestamptz', nullable: true })
  appDate!: Date | null;

  @Column({ name: 'app_state', type: 'varchar', length: 15 })
  appState!: AppointmentState;

  @Column({ name: 'app_type', type: 'varchar', length: 15 })
  appType!: AppointmentType;

  @Column({ name: 'app_reason', type: 'text', nullable: true })
  appReason!: string | null;

  @Column({ name: 'app_discard_reason', type: 'text', nullable: true })
  appDiscardReason!: string | null;

  @Column({ name: 'app_date_ideal', type: 'timestamptz', nullable: true })
  appDateIdeal!: Date | null;

  @Column({ name: 'app_duration', type: 'integer', nullable: true })
  appDuration!: number | null;

  @Column({ name: 'app_created_at', type: 'timestamptz', default: () => 'now()' })
  appCreatedAt!: Date;
}

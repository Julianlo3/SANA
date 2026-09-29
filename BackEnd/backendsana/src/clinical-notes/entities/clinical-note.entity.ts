import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Entity representing clinical notes for appointments
 * Maps to table clinical_notes in the database
 */
@Entity({ name: 'clinical_notes' })
export class ClinicalNote {
  @PrimaryGeneratedColumn({ name: 'cn_id' })
  cnId!: number;

  @Column({ name: 'app_id', type: 'integer' })
  appId!: number;

  @Column({ name: 'psy_id', type: 'integer' })
  psyId!: number;

  @Column({ name: 'cn_observation', type: 'text' })
  cnObservation!: string;

  @Column({ name: 'cn_created_at', type: 'timestamptz', default: () => 'now()' })
  cnCreatedAt!: Date;
}

import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'psychologist' })
export class Psychologist {
  @PrimaryColumn({ name: 'psy_id' })
  id!: number;

  @Column({ name: 'psy_license_number' })
  licenseNumber!: number;

  @Column({ name: 'psy_speciality', length: 45 })
  speciality!: string;

  @Column({ name: 'psy_termns_accpted', type: 'boolean', default: false })
  termsAccepted!: boolean;

  @Column({ name: 'psy_policy_accepted_at', type: 'timestamptz', nullable: true })
  policyAcceptedAt!: Date | null;

  @Column({ name: 'psy_policy_version', type: 'varchar', length: 50, nullable: true })
  policyVersion!: string | null;
}
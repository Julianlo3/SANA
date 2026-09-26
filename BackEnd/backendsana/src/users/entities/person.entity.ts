import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type PersonState = 'activo' | 'inactivo' | 'bloqueado' | 'pendiente';

@Entity({ name: 'person' })
export class Person {
  @PrimaryGeneratedColumn({ name: 'per_id' })
  perId!: number;

  @Column({ name: 'per_name', length: 100 })
  perName!: string;

  @Column({ name: 'per_identity_document', type: 'integer', nullable: true })
  perIdentityDocument!: number | null;

  @Column({ name: 'per_email', length: 100 })
  perEmail!: string;

  @Column({ name: 'per_contact_number', type: 'bigint', nullable: true })
  perContactNumber!: string | null;

  @Column({ name: 'per_state', type: 'varchar', length: 15, default: 'activo' })
  perState!: PersonState;

  @Column({ name: 'per_update_date', type: 'timestamptz', nullable: true })
  perUpdateDate!: Date | null;

  @Column({ name: 'per_created_by', type: 'integer', nullable: true })
  perCreatedBy!: number | null;

  @Column({ name: 'per_card_type', type: 'varchar', length: 20, nullable: true })
  perCardType!: string | null;

  @Column({ name: 'per_birthdate', type: 'date', nullable: true })
  perBirthdate!: string | null;

  @Column({ name: 'per_gender', type: 'char', length: 1, nullable: true })
  perGender!: string | null;

  @Column({ name: 'per_termns_accpted', type: 'boolean', default: false })
  perTermsAccepted!: boolean;

  @Column({ name: 'per_policy_accepted_at', type: 'timestamptz', nullable: true })
  perPolicyAcceptedAt!: Date | null;

  @Column({ name: 'per_policy_version', type: 'varchar', length: 50, nullable: true })
  perPolicyVersion!: string | null;

  @Column({
    name: 'per_created_at',
    type: 'timestamptz',
    default: () => 'now()',
  })
  perCreatedAt!: Date;
}

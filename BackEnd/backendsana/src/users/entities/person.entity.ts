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

  @Column({
    name: 'per_created_at',
    type: 'timestamptz',
    default: () => 'now()',
  })
  perCreatedAt!: Date;
}

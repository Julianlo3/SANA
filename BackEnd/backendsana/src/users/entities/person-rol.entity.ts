import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'person_rol' })
export class PersonRol {
  @PrimaryColumn({ name: 'per_id' })
  perId!: number;

  @PrimaryColumn({ name: 'rol_id' })
  rolId!: number;

  @Column({ name: 'pr_assigned_at', type: 'timestamptz' })
  assignedAt!: Date;

  @Column({ name: 'pr_active', default: true })
  active!: boolean;
}

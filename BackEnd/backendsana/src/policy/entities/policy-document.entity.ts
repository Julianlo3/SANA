import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Entity for policy documents
 */
@Entity({ name: 'policy_documents' })
export class PolicyDocument {
  @PrimaryGeneratedColumn({ name: 'pd_id' })
  pdId!: number;

  @Column({ name: 'pd_type', length: 30 })
  pdType!: string;

  @Column({ name: 'pd_version', length: 50 })
  pdVersion!: string;

  @Column({ name: 'pd_content', type: 'text' })
  pdContent!: string;

  @Column({ name: 'pd_effective_from', type: 'timestamptz', default: () => 'now()' })
  pdEffectiveFrom!: Date;
}

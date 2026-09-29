import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Entity representing audit logs for clinical notes
 * Maps to table clinical_notes_audit in the database
 */
@Entity({ name: 'clinical_notes_audit' })
export class ClinicalNoteAudit {
  @PrimaryGeneratedColumn({ name: 'cna_id' })
  cnaId!: number;

  @Column({ name: 'cn_id', type: 'integer' })
  cnId!: number;

  @Column({ name: 'psy_id', type: 'integer' })
  psyId!: number;

  @Column({ name: 'cna_date', type: 'timestamptz' })
  cnaDate!: Date;

  @Column({ name: 'cna_ip_address', type: 'varchar', length: 50 })
  cnaIpAddress!: string;
}

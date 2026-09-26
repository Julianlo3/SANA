import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** 
 * Table `dependents`: minors registered by a consultant.
 */
@Entity({ name: 'dependents' })
export class Dependent {
  @PrimaryGeneratedColumn({ name: 'dep_id' })
  depId!: number;

  @Column({ name: 'dep_identity_document' })
  depIdentityDocument!: number;

  @Column({ name: 'dep_name', length: 100 })
  depName!: string;

  @Column({ name: 'dep_contact_number', type: 'bigint', nullable: true })
  depContactNumber!: string | null;

  @Column({ name: 'dep_birthdate', type: 'date' })
  depBirthdate!: string;

  @Column({ name: 'dep_gender', type: 'char', length: 1, nullable: true })
  depGender!: string | null;

  @Column({ name: 'dep_termns_accpted', type: 'boolean', default: false })
  depTermsAccepted!: boolean;

  @Column({ name: 'dep_policy_accepted_at', type: 'timestamptz', nullable: true })
  depPolicyAcceptedAt!: Date | null;

  @Column({ name: 'dep_policy_version', type: 'varchar', length: 50, nullable: true })
  depPolicyVersion!: string | null;
}

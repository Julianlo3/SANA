import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Entity for storing dependent information
 */
@Entity({ name: 'dependents' })
export class Dependent {
  @PrimaryGeneratedColumn({ name: 'dep_id' })
  depId!: number;

  @Column({ name: 'dep_identity_document', type: 'bigint' })
  depIdentityDocument!: string;

  @Column({ name: 'dep_name', length: 100 })
  depName!: string;

  @Column({ name: 'dep_birthdate', type: 'date' })
  depBirthdate!: string;

  @Column({ name: 'dep_gender', type: 'char', length: 1, nullable: true })
  depGender!: string | null;
}

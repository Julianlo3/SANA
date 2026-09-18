import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'psychologist' })
export class Psychologist {
  @PrimaryColumn({ name: 'psy_id' })
  id!: number;

  @Column({ name: 'psy_license_number' })
  licenseNumber!: number;

  @Column({ name: 'psy_speciality', length: 45 })
  speciality!: string;
}
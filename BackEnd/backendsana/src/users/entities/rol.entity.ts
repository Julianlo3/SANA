import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'rol' })
/** Represents a role available to a person in the authorization model. */
export class Rol {
  @PrimaryColumn({ name: 'rol_id' })
  rolId!: number;

  @Column({ name: 'rol_description', length: 25 })
  rolDescription!: string;
}

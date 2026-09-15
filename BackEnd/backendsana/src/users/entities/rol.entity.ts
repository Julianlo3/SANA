import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'rol' })
export class Rol {
  @PrimaryColumn({ name: 'rol_id' })
  rolId!: number;

  @Column({ name: 'rol_description', length: 25 })
  rolDescription!: string;
}

import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Tabla `requester_dependent`: menores de edad registrados por un consultante. */
@Entity({ name: 'requester_dependent' })
export class RequesterDependent {
  @PrimaryColumn({ name: 'req_id' })
  requesterPersonId!: number;

  @PrimaryColumn({ name: 'dep_id' })
  dependentId!: number;

  @Column({ name: 'rel_id', type: 'integer', nullable: true })
  relationshipId!: number | null;
}

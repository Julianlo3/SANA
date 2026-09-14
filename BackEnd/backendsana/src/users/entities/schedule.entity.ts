import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** Franjas horarias de un psicologo; usada solo para detectar registros asociados. */
@Entity({ name: 'schedule' })
export class Schedule {
  @PrimaryGeneratedColumn({ name: 'sch_id' })
  scheduleId!: number;

  @Column({ name: 'psy_id' })
  psychologistUserId!: number;
}

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Mapea unicamente las columnas de `appointments` necesarias para detectar
 * si una persona tiene citas asociadas, en cualquiera de sus posibles roles
 * dentro de la cita (psicologo, secretario, consultante o paciente).
 */
@Entity({ name: 'appointments' })
export class Appointment {
  @PrimaryGeneratedColumn({ name: 'app_id' })
  appId!: number;

  @Column({ name: 'psy_id' })
  psychologistUserId!: number;

  @Column({ name: 'sec_id' })
  secretaryUserId!: number;

  @Column({ name: 'req_id' })
  requesterPersonId!: number;

  @Column({ name: 'app_patient_person_id', type: 'integer', nullable: true })
  patientPersonId!: number | null;

  @Column({ name: 'app_patient_dependent_id', type: 'integer', nullable: true })
  patientDependentId!: number | null;
}

import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ScheduleService } from '../schedule/schedule.service.js';
import type { CreateCarePackageDto, CloseCarePackageDto } from './dto/care-package.dto.js';

@Injectable()
export class CarePackagesService {
  constructor(private readonly db: DataSource, private readonly schedule: ScheduleService) {}
  async create(dto: CreateCarePackageDto, secretaryId: number) {
    return this.db.transaction(async m => {
      const a = (await m.query<any[]>(`SELECT app_id,app_state,psy_id,app_patient_person_id,app_patient_dependent_id FROM appointments WHERE app_id=$1 FOR UPDATE`, [dto.assessmentAppointmentId]))[0];
      if (!a) throw new NotFoundException('La valoración no existe');
      if (a.app_state !== 'realizada' || !a.psy_id) throw new BadRequestException({ error:'ASSESSMENT_REQUIRED', message:'El paquete requiere una valoración realizada con psicólogo' });
      const active = await m.query<any[]>(`SELECT cp_id FROM care_packages WHERE cp_state='activo' AND ((cp_patient_person_id IS NOT NULL AND cp_patient_person_id=$1) OR (cp_patient_dependent_id IS NOT NULL AND cp_patient_dependent_id=$2)) FOR UPDATE`, [a.app_patient_person_id, a.app_patient_dependent_id]);
      if (active.length) throw new ConflictException({ error:'ACTIVE_CARE_PACKAGE_EXISTS', message:'El paciente ya tiene un paquete activo' });
      const rows = await m.query<any[]>(`INSERT INTO care_packages(cp_patient_person_id,cp_patient_dependent_id,cp_assessment_app_id,psy_id,sec_id,cp_session_limit,cp_priority) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING cp_id AS "id",cp_state AS state,cp_session_limit AS "sessionLimit",cp_priority AS priority,psy_id AS "psychologistId"`, [a.app_patient_person_id,a.app_patient_dependent_id,a.app_id,a.psy_id,secretaryId,dto.sessionLimit,dto.priority]);
      return rows[0];
    });
  }
  async find(id:number) { const row=(await this.db.query<any[]>(`SELECT cp_id AS "id",cp_state AS state,cp_session_limit AS "sessionLimit",cp_priority AS priority,psy_id AS "psychologistId",cp_patient_person_id AS "patientPersonId",cp_patient_dependent_id AS "patientDependentId" FROM care_packages WHERE cp_id=$1`,[id]))[0]; if(!row) throw new NotFoundException('Paquete no encontrado'); return row; }
  async availability(id:number, requesterId:number, query:any) { const p=await this.find(id); const allowed=await this.db.query<any[]>(`SELECT 1 FROM care_packages cp LEFT JOIN requester_dependent rd ON rd.dep_id=cp.cp_patient_dependent_id WHERE cp.cp_id=$1 AND (cp.cp_patient_person_id=$2 OR rd.req_id=$2)`,[id,requesterId]); if(!allowed.length) throw new NotFoundException('Paquete no encontrado'); return this.schedule.findAvailability({...query, psychologistIds:String(p.psychologistId)}); }
  async close(id:number, state:'finalizado'|'cancelado', dto:CloseCarePackageDto, secretaryId:number) { return this.db.transaction(async m=>{ const p=(await m.query<any[]>(`SELECT * FROM care_packages WHERE cp_id=$1 FOR UPDATE`,[id]))[0]; if(!p) throw new NotFoundException('Paquete no encontrado'); if(p.cp_state!=='activo') throw new BadRequestException('El paquete ya está cerrado'); await m.query(`UPDATE appointments SET app_state='cancelada' WHERE cp_id=$1 AND app_state IN ('asignada','confirmada')`,[id]); await m.query(`DELETE FROM schedule_occupancy WHERE app_id IN (SELECT app_id FROM appointments WHERE cp_id=$1 AND app_state='cancelada')`,[id]); await m.query(`UPDATE care_packages SET cp_state=$1,cp_closed_at=now(),cp_closed_by=$2,cp_close_reason=$3 WHERE cp_id=$4`,[state,secretaryId,dto.reason??null,id]); return this.find(id); }); }
}

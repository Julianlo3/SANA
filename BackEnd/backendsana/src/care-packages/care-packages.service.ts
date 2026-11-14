import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ScheduleService } from '../schedule/schedule.service.js';
import type { CreateCarePackageDto, CloseCarePackageDto, SchedulePackageAppointmentDto } from './dto/care-package.dto.js';

@Injectable()
export class CarePackagesService {
  constructor(private readonly db: DataSource, private readonly schedule: ScheduleService) {}
  async create(dto: CreateCarePackageDto, secretaryId: number) {
    return this.db.transaction(async m => {
      const a = (await m.query<any[]>(`SELECT app_id,app_state,app_kind,psy_id,app_patient_person_id,app_patient_dependent_id FROM appointments WHERE app_id=$1 FOR UPDATE`, [dto.assessmentAppointmentId]))[0];
      if (!a) throw new NotFoundException('La valoración no existe');
      if (a.app_kind !== 'valoracion' || a.app_state !== 'realizada' || !a.psy_id) throw new BadRequestException({ error:'ASSESSMENT_REQUIRED', message:'El paquete requiere una valoración realizada con psicólogo' });
      const active = await m.query<any[]>(`SELECT cp_id FROM care_packages WHERE cp_state='activo' AND ((cp_patient_person_id IS NOT NULL AND cp_patient_person_id=$1) OR (cp_patient_dependent_id IS NOT NULL AND cp_patient_dependent_id=$2)) FOR UPDATE`, [a.app_patient_person_id, a.app_patient_dependent_id]);
      if (active.length) throw new ConflictException({ error:'ACTIVE_CARE_PACKAGE_EXISTS', message:'El paciente ya tiene un paquete activo' });
      const rows = await m.query<any[]>(`INSERT INTO care_packages(cp_patient_person_id,cp_patient_dependent_id,cp_assessment_app_id,psy_id,sec_id,cp_session_limit,cp_priority) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING cp_id AS "id",cp_state AS state,cp_session_limit AS "sessionLimit",cp_priority AS priority,psy_id AS "psychologistId"`, [a.app_patient_person_id,a.app_patient_dependent_id,a.app_id,a.psy_id,secretaryId,dto.sessionLimit,dto.priority]);
      return rows[0];
    });
  }
  /** Lists every package for the secretary's management view. */
  async findAll() {
    return this.db.query<any[]>(
      `SELECT
         cp.cp_id AS "id",
         cp.cp_state AS state,
         cp.cp_session_limit AS "sessionLimit",
         cp.cp_priority AS priority,
         cp.cp_created_at AS "createdAt",
         cp.cp_closed_at AS "closedAt",
         cp.psy_id AS "psychologistId",
         psy.per_name AS "psychologistName",
         CASE WHEN cp.cp_patient_dependent_id IS NOT NULL THEN 'dependent' ELSE 'self' END AS "patientType",
         COALESCE(dep.dep_name, patient.per_name) AS "patientName",
         COUNT(a.app_id) FILTER (WHERE a.app_state = 'realizada')::int AS "completedSessions",
         COUNT(a.app_id) FILTER (WHERE a.app_state IN ('asignada', 'confirmada'))::int AS "reservedSessions"
       FROM care_packages cp
       LEFT JOIN appointments assessment ON assessment.app_id = cp.cp_assessment_app_id
       LEFT JOIN person patient ON patient.per_id = cp.cp_patient_person_id
       LEFT JOIN dependents dep ON dep.dep_id = cp.cp_patient_dependent_id
       LEFT JOIN person psy ON psy.per_id = cp.psy_id
       LEFT JOIN appointments a ON a.cp_id = cp.cp_id
       GROUP BY cp.cp_id, psy.per_name, dep.dep_name, patient.per_name
       ORDER BY CASE cp.cp_state WHEN 'activo' THEN 0 ELSE 1 END, cp.cp_created_at DESC`,
    );
  }
  async find(id:number) { const row=(await this.db.query<any[]>(`SELECT cp_id AS "id",cp_state AS state,cp_session_limit AS "sessionLimit",cp_priority AS priority,psy_id AS "psychologistId",cp_patient_person_id AS "patientPersonId",cp_patient_dependent_id AS "patientDependentId" FROM care_packages WHERE cp_id=$1`,[id]))[0]; if(!row) throw new NotFoundException('Paquete no encontrado'); return row; }
  async availability(id:number, requesterId:number, query:any) { const p=await this.find(id); const allowed=await this.db.query<any[]>(`SELECT 1 FROM care_packages cp LEFT JOIN requester_dependent rd ON rd.dep_id=cp.cp_patient_dependent_id WHERE cp.cp_id=$1 AND (cp.cp_patient_person_id=$2 OR rd.req_id=$2)`,[id,requesterId]); if(!allowed.length) throw new NotFoundException('Paquete no encontrado'); return this.schedule.findAvailability({...query, psychologistIds:String(p.psychologistId)}); }
  async scheduleAppointment(id: number, dto: SchedulePackageAppointmentDto, actor: { requesterId?: number; secretaryId?: number }) {
    const date = new Date(dto.appDate);
    if (Number.isNaN(date.getTime()) || date <= new Date()) throw new BadRequestException('La fecha debe ser futura');
    return this.db.transaction(async (m) => {
      const p = (await m.query<any[]>(`SELECT cp.*, a.req_id, a.app_type FROM care_packages cp JOIN appointments a ON a.app_id=cp.cp_assessment_app_id WHERE cp.cp_id=$1 FOR UPDATE`, [id]))[0];
      if (!p) throw new NotFoundException('Paquete no encontrado');
      if (p.cp_state !== 'activo') throw new BadRequestException('El paquete no está activo');
      if (actor.requesterId) {
        const ownsDependent = await m.query<any[]>(`SELECT 1 FROM requester_dependent WHERE req_id=$1 AND dep_id=$2`, [actor.requesterId, p.cp_patient_dependent_id]);
        if (p.req_id !== actor.requesterId && !ownsDependent.length) throw new NotFoundException('Paquete no encontrado');
      }
      const used = await m.query<any[]>(`SELECT COUNT(*)::int AS count FROM appointments WHERE cp_id=$1 AND app_state IN ('realizada','asignada','confirmada')`, [id]);
      if (Number(used[0].count) >= Number(p.cp_session_limit)) throw new ConflictException('El paquete no tiene cupos disponibles');
      const day = date.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
      const time = date.toLocaleTimeString('en-GB', { timeZone: 'America/Bogota', hour12: false });
      await m.query(`SELECT pg_advisory_xact_lock(hashtext('care-package-slot'), hashtext($1::text || $2::text || $3::text))`, [p.psy_id, day, time]);
      const free = await m.query<any[]>(`SELECT 1 WHERE (EXISTS (SELECT 1 FROM schedule s WHERE s.psy_id=$1 AND s.sch_date=$2::date AND s.sch_start_time <= $3::time AND s.sch_end_time >= ($3::time + interval '60 minutes')) OR EXISTS (SELECT 1 FROM schedule_recurring_blocks r WHERE r.psy_id=$1 AND r.srb_active=true AND r.srb_day_of_week=EXTRACT(ISODOW FROM $2::date) AND r.srb_valid_from <= $2::date AND (r.srb_valid_until IS NULL OR r.srb_valid_until >= $2::date) AND r.srb_start_time <= $3::time AND r.srb_end_time >= ($3::time + interval '60 minutes'))) AND NOT EXISTS (SELECT 1 FROM schedule_occupancy WHERE psy_id=$1 AND occ_date=$2::date AND occ_start_time < ($3::time + interval '60 minutes') AND occ_end_time > $3::time)`, [p.psy_id, day, time]);
      if (!free.length) throw new ConflictException({ error: 'SCHEDULE_SLOT_TAKEN', message: 'La franja ya no está disponible' });
      const app = (await m.query<any[]>(`INSERT INTO appointments(req_id,app_patient_person_id,app_patient_dependent_id,psy_id,sec_id,app_date,app_duration,app_state,app_type,app_created_at,cp_id,app_kind) VALUES($1,$2,$3,$4,$5,$6,60,'confirmada',$7,now(),$8,'paquete') RETURNING app_id AS "appId",app_date AS "appDate",app_kind AS "appKind",cp_id AS "carePackageId"`, [p.req_id,p.cp_patient_person_id,p.cp_patient_dependent_id,p.psy_id,actor.secretaryId ?? null,date,p.app_type,id]))[0];
      await m.query(`INSERT INTO schedule_occupancy(psy_id,app_id,occ_date,occ_start_time,occ_end_time,source_type) VALUES($1,$2,$3::date,$4::time,($4::time + interval '60 minutes'),'appointment')`, [p.psy_id, app.appId, day, time]);
      return app;
    });
  }
  async close(id:number, state:'finalizado'|'cancelado', dto:CloseCarePackageDto, secretaryId:number) { return this.db.transaction(async m=>{ const p=(await m.query<any[]>(`SELECT * FROM care_packages WHERE cp_id=$1 FOR UPDATE`,[id]))[0]; if(!p) throw new NotFoundException('Paquete no encontrado'); if(p.cp_state!=='activo') throw new BadRequestException('El paquete ya está cerrado'); await m.query(`UPDATE appointments SET app_state='cancelada' WHERE cp_id=$1 AND app_state IN ('asignada','confirmada')`,[id]); await m.query(`DELETE FROM schedule_occupancy WHERE app_id IN (SELECT app_id FROM appointments WHERE cp_id=$1 AND app_state='cancelada')`,[id]); await m.query(`UPDATE care_packages SET cp_state=$1,cp_closed_at=now(),cp_closed_by=$2,cp_close_reason=$3 WHERE cp_id=$4`,[state,secretaryId,dto.reason??null,id]); return this.find(id); }); }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicalNote } from './entities/clinical-note.entity.js';
import { ClinicalNoteAudit } from './entities/clinical-note-audit.entity.js';
import { ClinicalNotesController } from './clinical-notes.controller.js';
import { ClinicalNotesService } from './clinical-notes.service.js';
import { ClinicalNotesRepository } from './clinical-notes.repository.js';
import { AppointmentsModule } from '../appointments/appointments.module.js';
import { AuthModule } from '../modules/auth.module.js';

@Module({
  imports: [
    AuthModule,
    AppointmentsModule,
    TypeOrmModule.forFeature([
      ClinicalNote,
      ClinicalNoteAudit,
    ]),
  ],
  controllers: [ClinicalNotesController],
  providers: [ClinicalNotesService, ClinicalNotesRepository],
  exports: [ClinicalNotesService, ClinicalNotesRepository],
})
export class ClinicalNotesModule {}

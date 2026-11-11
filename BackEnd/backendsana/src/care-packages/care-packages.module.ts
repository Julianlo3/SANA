import { Module } from '@nestjs/common'; import { ScheduleModule } from '../schedule/schedule.module.js'; import { CarePackagesController } from './care-packages.controller.js'; import { CarePackagesService } from './care-packages.service.js';
@Module({imports:[ScheduleModule],controllers:[CarePackagesController],providers:[CarePackagesService]}) export class CarePackagesModule {}

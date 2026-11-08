import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { RolesGuard } from '../guards/roles.guard.js';
import { SecurityLogModule } from '../security-logs/security-log.module.js';
import { Donation } from './entities/donation.entity.js';
import { DonationsController } from './donations.controller.js';
import { DonationsService } from './donations.service.js';

/** Registers donation persistence and Wompi webhook handling. */
@Module({
  imports: [AuthModule, SecurityLogModule, TypeOrmModule.forFeature([Donation])],
  controllers: [DonationsController],
  providers: [DonationsService, RolesGuard],
  exports: [DonationsService],
})
export class DonationsModule {}

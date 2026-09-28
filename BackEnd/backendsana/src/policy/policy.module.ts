import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PolicyDocument } from './entities/policy-document.entity.js';
import { PolicyAcceptance } from './entities/policy-acceptance.entity.js';
import { PolicyRepository } from './policy.repository.js';
import { PolicyService } from './policy.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([PolicyDocument, PolicyAcceptance])],
  providers: [PolicyRepository, PolicyService],
  exports: [PolicyRepository, PolicyService],
})
export class PolicyModule {}

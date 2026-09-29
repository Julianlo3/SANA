import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PolicyService } from './policy.service.js';

@Controller('policy')
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @Get(':type')
  async getCurrentPolicy(@Param('type') type: string) {
    const document = await this.policyService.getCurrentPolicyDocument(type);
    if (!document) {
      throw new NotFoundException(`No policy document found for type: ${type}`);
    }
    return document;
  }
}
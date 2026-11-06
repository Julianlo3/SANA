import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { PolicyService } from './policy.service.js';

@Controller('policy')
/** Serves the current public version of each policy document. */
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @Get(':type')
  /**
   * Retrieves the active policy document for the requested policy type.
   *
   * @param type Policy type identifier.
   * @returns The current policy document.
   * @throws {NotFoundException} When no current document exists for the type.
   */
  async getCurrentPolicy(@Param('type') type: string) {
    const document = await this.policyService.getCurrentPolicyDocument(type);
    if (!document) {
      throw new NotFoundException(`No policy document found for type: ${type}`);
    }
    return document;
  }
}

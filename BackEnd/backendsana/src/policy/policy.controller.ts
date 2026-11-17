import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ApiControllerDocs } from '../openapi/api-controller-docs.decorator.js';
import { PolicyService } from './policy.service.js';

@Controller('policy')
@ApiControllerDocs('Policies')
/** Serves the current public version of each policy document. */
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @Get(':type')
  @ApiOperation({ summary: 'Get the current policy document' })
  @ApiParam({
    name: 'type',
    description: 'Policy document type identifier.',
    type: String,
  })
  @ApiResponse({
    status: 404,
    description: 'No active policy exists for this type.',
  })
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

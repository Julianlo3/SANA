import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service.js';

@ApiTags('Health')
@Controller()
/** Exposes the lightweight root and health-check endpoints for the API. */
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'API greeting' })
  @ApiResponse({ status: 200, description: 'API greeting' })
  /** Returns the default API greeting. */
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('healthz')
  @ApiOperation({ summary: 'Liveness check' })
  @ApiResponse({ status: 200, description: 'Liveness check' })
  /** Returns the liveness payload used by deployment health checks. */
  getHealth()  {
    return { status: 'ok' };
  }
}

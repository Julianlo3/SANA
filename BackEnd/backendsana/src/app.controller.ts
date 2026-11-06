import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
/** Exposes the lightweight root and health-check endpoints for the API. */
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  /** Returns the default API greeting. */
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('healthz')
  /** Returns the liveness payload used by deployment health checks. */
  getHealth()  {
    return { status: 'ok' };
  }
}

import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { describe, expect, it } from 'vitest';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard.js';
import { OriginGuard } from '../../src/guards/origin.guard.js';
import { ROLES_KEY, RolesGuard } from '../../src/guards/roles.guard.js';
import { ReportsController } from '../../src/reports/reports.controller.js';

describe('ReportsController', () => {
  it('restricts the summary to authenticated administrators', () => {
    const handler = ReportsController.prototype.getSummary;

    expect(Reflect.getMetadata(GUARDS_METADATA, ReportsController)).toEqual([
      OriginGuard,
      JwtAuthGuard,
      RolesGuard,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, ReportsController)).toEqual([
      'administrador',
    ]);
    expect(Reflect.getMetadata(GUARDS_METADATA, handler) ?? []).toEqual([]);
  });
});

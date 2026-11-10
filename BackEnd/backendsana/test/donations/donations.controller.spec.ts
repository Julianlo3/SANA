import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { describe, expect, it } from 'vitest';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard.js';
import { DonationsController } from '../../src/donations/donations.controller.js';
import { OriginGuard } from '../../src/guards/origin.guard.js';
import { RateLimitGuard } from '../../src/guards/rate-limit.guard.js';
import { ROLES_KEY, RolesGuard } from '../../src/guards/roles.guard.js';

const handler = (name: keyof DonationsController) => DonationsController.prototype[name];

function guardsOf(name: keyof DonationsController): unknown[] {
  return Reflect.getMetadata(GUARDS_METADATA, handler(name)) ?? [];
}

describe('DonationsController access', () => {
  it.each(['findAll', 'findByTransactionId'] as const)(
    'restricts %s to authenticated administrators, since it returns donor data and IP',
    (name) => {
      expect(guardsOf(name)).toEqual([OriginGuard, JwtAuthGuard, RolesGuard]);
      expect(Reflect.getMetadata(ROLES_KEY, handler(name))).toEqual(['administrador']);
    },
  );

  it('keeps the checkout public for donors, with origin check and rate limit', () => {
    expect(guardsOf('createCheckout')).toEqual([OriginGuard, RateLimitGuard]);
    expect(Reflect.getMetadata(ROLES_KEY, handler('createCheckout'))).toBeUndefined();
  });

  it('keeps the Wompi webhook reachable without browser guards', () => {
    expect(guardsOf('receiveWompiEvent')).toEqual([]);
  });
});

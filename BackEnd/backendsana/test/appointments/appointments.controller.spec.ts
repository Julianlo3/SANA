import { describe, expect, it, vi } from 'vitest';
import { AppointmentsController } from '../../src/appointments/appointments.controller.js';
import { UserRole } from '../../src/models/user-role.enum.js';

describe('AppointmentsController dependent endpoints and guards', () => {
  it('exposes GET /appointments/relationships as a public rate-limited catalog', () => {
    const guards =
      Reflect.getMetadata('__guards__', AppointmentsController.prototype.findRelationships) ?? [];
    const guardNames = guards.map((g: { name: string }) => g.name);
    const roles = Reflect.getMetadata(
      'roles',
      AppointmentsController.prototype.findRelationships,
    );

    expect(guardNames).toContain('RateLimitGuard');
    expect(guardNames).not.toContain('JwtAuthGuard');
    expect(roles).toBeUndefined();
  });

  it.each(['findMyDependents', 'registerDependent', 'requestDependentAppointment'] as const)(
    'protects %s with JwtAuthGuard, RolesGuard, and UserRole.Requester',
    (methodName) => {
      const handler = AppointmentsController.prototype[methodName];
      const guards = Reflect.getMetadata('__guards__', handler) ?? [];
      const guardNames = guards.map((g: { name: string }) => g.name);
      const roles = Reflect.getMetadata('roles', handler);

      expect(guardNames).toContain('JwtAuthGuard');
      expect(guardNames).toContain('RolesGuard');
      expect(roles).toEqual([UserRole.Requester]);
    },
  );

  it('delegates dependent endpoints to AppointmentsService with authenticated personId and IP', async () => {
    const service = {
      findMyDependents: vi.fn().mockResolvedValue([]),
      registerDependent: vi.fn().mockResolvedValue({ depId: 5 }),
      requestDependentAppointment: vi.fn().mockResolvedValue({ appId: 77, message: 'ok' }),
    };
    const controller = new AppointmentsController(service as never);
    const request = {
      user: { personId: 13, roles: [UserRole.Requester] },
      ip: '198.51.100.12',
      socket: { remoteAddress: '127.0.0.1' },
    };

    await controller.findMyDependents(request as never);
    expect(service.findMyDependents).toHaveBeenCalledWith(13);

    const depDto = {
      name: 'Samuel',
      identityDocument: '1190001001',
      birthdate: '2016-05-14',
      relationshipId: 1,
    };
    await controller.registerDependent(request as never, depDto as never);
    expect(service.registerDependent).toHaveBeenCalledWith(depDto, 13);

    const appDto = { appType: 'virtual', dependentTermsAccepted: true };
    await controller.requestDependentAppointment(
      request as never,
      5,
      appDto as never,
    );
    expect(service.requestDependentAppointment).toHaveBeenCalledWith(
      5,
      appDto,
      request.user,
      '198.51.100.12',
    );
  });
});

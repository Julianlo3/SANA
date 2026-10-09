import { describe, expect, it, vi } from 'vitest';
import { UsersController } from '../../src/users/users.controller.js';

describe('UsersController', () => {
  const service = {
    create: vi.fn(),
    findAll: vi.fn(),
    getOwnProfile: vi.fn(),
    updateOwnProfile: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    remove: vi.fn(),
  };

  const adminRequest = {
    user: { userId: 42, personId: 42, email: 'admin@example.com', roles: ['administrador'], auth0Subject: 'auth0|1', state: 'activo' },
  };

  function setup() {
    vi.clearAllMocks();
    return new UsersController(service as never);
  }

  it('delegates creation to the service with the authenticated admin id', async () => {
    const controller = setup();
    const dto = {
      fullName: 'Ana',
      identityDocument: '123456',
      email: 'ana@gmail.com',
      phone: '3001234567',
      roleId: 4,
    };
    service.create.mockResolvedValue({ id: 1 });

    await expect(controller.create(adminRequest as never, dto as never)).resolves.toEqual({
      id: 1,
    });
    expect(service.create).toHaveBeenCalledWith(dto, 42);
  });

  it('forwards status and search filters when listing users', async () => {
    const controller = setup();
    service.findAll.mockResolvedValue([]);

    await controller.findAll('active', 'ana');
    expect(service.findAll).toHaveBeenCalledWith({
      status: 'active',
      search: 'ana',
    });
  });

  it('delegates self-service profile reads and updates using the authenticated person and roles', async () => {
    const controller = setup();
    const consultantRequest = {
      user: {
        ...adminRequest.user,
        personId: 84,
        roles: ['consultante'],
      },
    };
    const dto = { fullName: 'Ana', vulnerabilities: ['desplazamiento'] };
    service.getOwnProfile.mockResolvedValue({ fullName: 'Ana' });
    service.updateOwnProfile.mockResolvedValue({ fullName: 'Ana' });

    await expect(
      controller.getOwnProfile(consultantRequest as never),
    ).resolves.toEqual({ fullName: 'Ana' });
    expect(service.getOwnProfile).toHaveBeenCalledWith(84, ['consultante']);

    await expect(
      controller.updateOwnProfile(consultantRequest as never, dto as never),
    ).resolves.toEqual({ fullName: 'Ana' });
    expect(service.updateOwnProfile).toHaveBeenCalledWith(
      84,
      ['consultante'],
      dto,
    );
  });

  it('delegates edits, status changes and deletion by id', async () => {
    const controller = setup();
    service.update.mockResolvedValue({ id: 7 });
    service.updateStatus.mockResolvedValue({ id: 7, status: 'blocked' });
    service.remove.mockResolvedValue(undefined);

    await controller.update(7, { fullName: 'New name' } as never);
    expect(service.update).toHaveBeenCalledWith(7, { fullName: 'New name' });

    await controller.updateStatus(adminRequest as never, 7, {
      status: 'blocked',
    } as never);
    expect(service.updateStatus).toHaveBeenCalledWith(7, { status: 'blocked' }, 42);

    await controller.remove(7);
    expect(service.remove).toHaveBeenCalledWith(7);
  });
});

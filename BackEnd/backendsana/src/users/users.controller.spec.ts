import { describe, expect, it, vi } from 'vitest';
import { UsersController } from './users.controller.js';

describe('UsersController', () => {
  const service = {
    create: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    remove: vi.fn(),
  };

  function setup() {
    vi.clearAllMocks();
    return new UsersController(service as never);
  }

  it('delegates creation to the service', async () => {
    const controller = setup();
    const dto = {
      fullName: 'Ana',
      identityDocument: '123456',
      email: 'ana@gmail.com',
      phone: '3001234567',
      roleId: 4,
    };
    service.create.mockResolvedValue({ id: 1 });

    await expect(controller.create(dto as never)).resolves.toEqual({ id: 1 });
    expect(service.create).toHaveBeenCalledWith(dto);
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

  it('delegates edits, status changes and deletion by id', async () => {
    const controller = setup();
    service.update.mockResolvedValue({ id: 7 });
    service.updateStatus.mockResolvedValue({ id: 7, status: 'blocked' });
    service.remove.mockResolvedValue(undefined);

    await controller.update(7, { fullName: 'New name' } as never);
    expect(service.update).toHaveBeenCalledWith(7, { fullName: 'New name' });

    await controller.updateStatus(7, { status: 'blocked' } as never);
    expect(service.updateStatus).toHaveBeenCalledWith(7, { status: 'blocked' });

    await controller.remove(7);
    expect(service.remove).toHaveBeenCalledWith(7);
  });
});

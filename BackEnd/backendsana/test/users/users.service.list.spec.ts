import { describe, expect, it, vi } from 'vitest';
import { ASSIGNABLE_ROLES } from '../../src/users/users.constants.js';
import { UsersService } from '../../src/users/users.service.js';

describe('UsersService.findAll', () => {
  it('lists only people with an active assignable employee role', async () => {
    const queryBuilder = {
      where: vi.fn().mockReturnThis(),
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      getMany: vi.fn().mockResolvedValue([]),
    };
    const service = new UsersService(
      { createQueryBuilder: vi.fn().mockReturnValue(queryBuilder) } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(service.findAll({})).resolves.toEqual([]);

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('employee_role_definition.rol_description IN'),
      { employeeRoles: ASSIGNABLE_ROLES },
    );
    expect(queryBuilder.andWhere.mock.calls[0][0]).toContain(
      'employee_role.pr_active = true',
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      expect.stringContaining(
        'requester_role_definition.rol_description = :requesterRole',
      ),
      { requesterRole: 'consultante' },
    );
  });
});

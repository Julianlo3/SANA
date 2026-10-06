import { DataSource } from 'typeorm';
import { AppointmentsRepository } from './appointments.repository.js';

describe('AppointmentsRepository', () => {
  it('limits consultant appointment results to their person ID', async () => {
    const query = vi.fn().mockResolvedValue([]);
    const repository = new AppointmentsRepository({
      query,
    } as unknown as DataSource);

    await expect(repository.findByRequester(42)).resolves.toEqual([]);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE a.req_id = $1'),
      [42],
    );
    expect(query.mock.calls[0][0]).not.toContain('app_reason');
  });
});

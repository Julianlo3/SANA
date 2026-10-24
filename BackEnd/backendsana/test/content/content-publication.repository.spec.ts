import { describe, expect, it, vi } from 'vitest';
import { GalleryRepository } from '../../src/content/gallery/gallery.repository.js';
import { NewsRepository } from '../../src/content/news/news.repository.js';

describe('public content publication ordering (HU-4.2)', () => {
  it('limits public news to published items and sorts newest and pinned items first', async () => {
    const dataSource = {
      query: vi
        .fn()
        .mockResolvedValueOnce([{ id: 1, title: 'Latest' }])
        .mockResolvedValueOnce([{ total: 1 }]),
    };
    const repository = new NewsRepository(dataSource as never);

    await expect(repository.findPublished(10, 10)).resolves.toEqual({
      items: [{ id: 1, title: 'Latest' }],
      total: 1,
    });

    const [listingSql, listingParams] = dataSource.query.mock.calls[0] as [
      string,
      number[],
    ];
    expect(listingSql).toContain("WHERE nw_status = 'published'");
    expect(listingSql).toContain(
      'ORDER BY nw_is_pinned DESC, nw_published_at DESC, nw_id DESC',
    );
    expect(listingParams).toEqual([10, 10]);
  });

  it('shows only published gallery images in their configured display order', async () => {
    const images = [{ id: 4, imageUrl: 'https://example.com/image.jpg' }];
    const dataSource = { query: vi.fn().mockResolvedValueOnce(images) };
    const repository = new GalleryRepository(dataSource as never);

    await expect(repository.findPublished()).resolves.toBe(images);

    const [sql] = dataSource.query.mock.calls[0] as [string];
    expect(sql).toContain("WHERE gi_status = 'published'");
    expect(sql).toContain('ORDER BY gi_order, gi_id');
  });
});

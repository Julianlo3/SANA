import {
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateNewsDto } from '../../src/content/news/news.dto.js';
import { ContentService } from '../../src/content/content.service.js';
import { BannersService } from '../../src/content/banners/banners.service.js';
import { GalleryService } from '../../src/content/gallery/gallery.service.js';
import { NewsService } from '../../src/content/news/news.service.js';

const editor = { userId: 23 } as never;
const imageUrl = 'https://res.cloudinary.com/sana/image/upload/test.jpg';

function setupContentService() {
  const repository = {
    findItems: vi.fn(),
    saveItems: vi.fn(),
    findCards: vi.fn(),
    createCard: vi.fn(),
    findCardById: vi.fn(),
    updateCard: vi.fn(),
    deleteCard: vi.fn(),
    findActiveCards: vi.fn(),
  };
  const cloudinary = {
    ensureValidImage: vi.fn().mockResolvedValue(undefined),
    deleteImage: vi.fn(),
  };
  return {
    service: new ContentService(repository as never, cloudinary as never),
    repository,
    cloudinary,
  };
}

function setupNewsService() {
  const repository = {
    findAll: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    setStatus: vi.fn(),
    setPinned: vi.fn(),
    deleteRetired: vi.fn(),
    findPublished: vi.fn(),
    findPublishedById: vi.fn(),
  };
  const cloudinary = {
    ensureValidImage: vi.fn().mockResolvedValue(undefined),
    deleteImage: vi.fn(),
  };
  return {
    service: new NewsService(repository as never, cloudinary as never),
    repository,
    cloudinary,
  };
}

function setupGalleryService() {
  const repository = {
    findAll: vi.fn(),
    findPublished: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    findById: vi.fn(),
    setStatus: vi.fn(),
    deleteRetired: vi.fn(),
  };
  const cloudinary = {
    ensureValidImage: vi.fn().mockResolvedValue(undefined),
    deleteImage: vi.fn(),
  };
  return {
    service: new GalleryService(repository as never, cloudinary as never),
    repository,
    cloudinary,
  };
}

function setupBannersService() {
  const repository = {
    findAll: vi.fn(),
    countActive: vi.fn(),
    findCurrent: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    setActive: vi.fn(),
    deleteInactive: vi.fn(),
  };
  const cloudinary = {
    ensureValidImage: vi.fn().mockResolvedValue(undefined),
    deleteImage: vi.fn(),
  };
  const config = { get: vi.fn().mockReturnValue('3') };
  return {
    service: new BannersService(
      repository as never,
      cloudinary as never,
      config as never,
    ),
    repository,
    cloudinary,
    config,
  };
}

describe('ContentService institutional content (HU-4.1)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('saves mission and vision values then returns the refreshed content', async () => {
    const { service, repository } = setupContentService();
    const items = [
      { key: 'about.mission', value: 'Support families.' },
      { key: 'about.vision', value: 'A stronger community.' },
    ];
    repository.findItems.mockResolvedValue(items);

    await expect(service.saveItems(editor, { items } as never)).resolves.toEqual(
      items,
    );
    expect(repository.saveItems).toHaveBeenCalledWith(items, 23);
    expect(repository.findItems).toHaveBeenCalledOnce();
  });

  it('rejects required card fields and validates uploaded images before saving', async () => {
    const { service, repository, cloudinary } = setupContentService();

    await expect(
      service.createCard(
        editor,
        { section: 'services', title: '', description: 'A service' } as never,
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(repository.createCard).not.toHaveBeenCalled();

    cloudinary.ensureValidImage.mockRejectedValueOnce(
      new UnprocessableEntityException('Invalid image'),
    );
    await expect(
      service.createCard(
        editor,
        {
          section: 'team',
          title: 'A team member',
          subtitle: 'Counsellor',
          imageUrl,
          imageAlt: 'Portrait',
        } as never,
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(repository.createCard).not.toHaveBeenCalled();
  });

  it('keeps required section fields valid when editing an institutional card', async () => {
    const { service, repository } = setupContentService();
    const current = {
      id: 5,
      section: 'team',
      title: 'Ana',
      subtitle: 'Counsellor',
      description: null,
      imageUrl,
      imageAlt: 'Portrait',
    };
    repository.findCardById.mockResolvedValue(current);
    repository.updateCard.mockResolvedValue({ ...current, title: 'Ana Pérez' });

    await expect(
      service.updateCard(editor, 5, { title: 'Ana Pérez' } as never),
    ).resolves.toMatchObject({ title: 'Ana Pérez' });
    expect(repository.updateCard).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ title: 'Ana Pérez' }),
      23,
    );

    await expect(
      service.updateCard(editor, 5, { imageUrl: null } as never),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(repository.updateCard).toHaveBeenCalledOnce();
  });

  it('returns public content grouped by section and excludes inactive cards', async () => {
    const { service, repository } = setupContentService();
    repository.findItems.mockResolvedValue([
      { key: 'about.mission', value: 'Mission' },
      { key: 'about.vision', value: 'Vision' },
    ]);
    repository.findActiveCards.mockResolvedValue([
      {
        id: 1,
        section: 'values',
        title: 'Compassion',
        subtitle: null,
        description: null,
        imageUrl: null,
        imageAlt: null,
        isActive: true,
        updatedBy: { id: 23, name: 'Editor' },
      },
      {
        id: 2,
        section: 'team',
        title: 'Team member',
        subtitle: 'Counsellor',
        description: null,
        imageUrl,
        imageAlt: 'Portrait',
        isActive: true,
      },
    ]);

    await expect(service.findPublicContent()).resolves.toEqual({
      mission: 'Mission',
      vision: 'Vision',
      values: [
        {
          id: 1,
          title: 'Compassion',
          subtitle: null,
          description: null,
          imageUrl: null,
          imageAlt: null,
        },
      ],
      team: [
        {
          id: 2,
          title: 'Team member',
          subtitle: 'Counsellor',
          description: null,
          imageUrl,
          imageAlt: 'Portrait',
        },
      ],
      services: [],
      programs: [],
    });
    expect(repository.findActiveCards).toHaveBeenCalledOnce();
  });
});

describe('NewsService publishing and retirement (HU-4.2)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('validates image alt text and uploaded image before publishing news', async () => {
    const { service, repository, cloudinary } = setupNewsService();
    const news = { id: 4, title: 'News', status: 'published' };
    repository.create.mockResolvedValue(news);

    await expect(
      service.create(
        editor,
        { title: 'News', body: 'Details', imageUrl: imageUrl } as never,
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(cloudinary.ensureValidImage).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();

    await expect(
      service.create(
        editor,
        {
          title: 'News',
          body: 'Details',
          imageUrl,
          imageAlt: 'Event photo',
        } as never,
      ),
    ).resolves.toEqual(news);
    expect(cloudinary.ensureValidImage).toHaveBeenCalledWith(imageUrl, 'news');
    expect(repository.create).toHaveBeenCalledWith(
      {
        title: 'News',
        body: 'Details',
        imageUrl,
        imageAlt: 'Event photo',
      },
      23,
    );
  });

  it('rejects news with missing title or body before the service can publish it', async () => {
    const dto = plainToInstance(CreateNewsDto, {
      title: ' ',
      body: '',
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['title', 'body']),
    );
  });

  it('retires a news item and uses the repository public listing for visitor content', async () => {
    const { service, repository } = setupNewsService();
    const retired = { id: 4, status: 'retired' };
    repository.setStatus.mockResolvedValue(retired);
    repository.findPublished.mockResolvedValue({ items: [], total: 0 });

    await expect(service.setStatus(editor, 4, 'retired')).resolves.toEqual(
      retired,
    );
    await expect(service.findPublished({ page: 2, limit: 5 })).resolves.toEqual({
      items: [],
      total: 0,
      page: 2,
      limit: 5,
    });
    expect(repository.setStatus).toHaveBeenCalledWith(4, 'retired', 23);
    expect(repository.findPublished).toHaveBeenCalledWith(5, 5);
  });

  it('edits a news item while requiring accessible text for a replacement image', async () => {
    const { service, repository, cloudinary } = setupNewsService();
    const current = {
      id: 4,
      title: 'Old title',
      body: 'Details',
      imageUrl,
      imageAlt: 'Old image',
      status: 'published',
    };
    repository.findById.mockResolvedValue(current);
    repository.update.mockResolvedValue({ ...current, title: 'Updated title' });

    await expect(
      service.update(editor, 4, { title: 'Updated title' } as never),
    ).resolves.toMatchObject({ title: 'Updated title' });
    expect(repository.update).toHaveBeenCalledWith(
      4,
      { title: 'Updated title', body: undefined, imageUrl: undefined, imageAlt: undefined },
      23,
    );

    await expect(
      service.update(editor, 4, { imageAlt: null } as never),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(repository.update).toHaveBeenCalledOnce();
    expect(cloudinary.ensureValidImage).not.toHaveBeenCalled();
  });
});

describe('GalleryService publication and ordering (HU-4.2)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('validates a gallery upload and publishes/retire images through their status', async () => {
    const { service, repository, cloudinary } = setupGalleryService();
    const created = { id: 8, imageUrl, status: 'published', order: 0 };
    const retired = { ...created, status: 'retired' };
    repository.create.mockResolvedValue(created);
    repository.setStatus.mockResolvedValue(retired);
    repository.findPublished.mockResolvedValue([
      { id: 8, imageUrl, imageAlt: 'Community event', caption: null },
    ]);

    await expect(
      service.create(
        editor,
        { imageUrl, imageAlt: 'Community event', caption: '' } as never,
      ),
    ).resolves.toEqual(created);
    expect(cloudinary.ensureValidImage).toHaveBeenCalledWith(imageUrl, 'gallery');
    expect(repository.create).toHaveBeenCalledWith(
      { imageUrl, imageAlt: 'Community event', caption: null },
      23,
    );

    await expect(service.setStatus(editor, 8, 'retired')).resolves.toEqual(
      retired,
    );
    await expect(service.findPublished()).resolves.toEqual([
      { id: 8, imageUrl, imageAlt: 'Community event', caption: null },
    ]);
  });

  it('edits gallery captions and display order', async () => {
    const { service, repository } = setupGalleryService();
    const updated = {
      id: 8,
      imageUrl,
      imageAlt: 'Community event',
      caption: null,
      order: 3,
    };
    repository.update.mockResolvedValue(updated);

    await expect(
      service.update(editor, 8, { caption: '', order: 3 } as never),
    ).resolves.toEqual(updated);
    expect(repository.update).toHaveBeenCalledWith(
      8,
      { imageAlt: undefined, caption: null, order: 3 },
      23,
    );
  });
});

describe('BannersService limits and activation (HU-4.3)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires an image and alt text for active banners and enforces the configured limit', async () => {
    const { service, repository, cloudinary } = setupBannersService();
    const active = {
      id: 2,
      title: 'Current campaign',
      imageUrl,
      imageAlt: 'Campaign banner',
      isActive: true,
    };
    repository.create.mockResolvedValue(active);

    await expect(
      service.create(
        editor,
        { title: 'Current campaign', isActive: true } as never,
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(repository.create).not.toHaveBeenCalled();

    await expect(
      service.create(
        editor,
        {
          title: 'Current campaign',
          imageUrl,
          imageAlt: 'Campaign banner',
          isActive: true,
        } as never,
      ),
    ).resolves.toEqual(active);
    expect(cloudinary.ensureValidImage).toHaveBeenCalledWith(imageUrl, 'banners');
    expect(repository.create).toHaveBeenCalledWith(
      {
        title: 'Current campaign',
        imageUrl,
        imageAlt: 'Campaign banner',
      },
      true,
      23,
      3,
    );

    repository.create.mockResolvedValueOnce('ACTIVE_LIMIT_REACHED');
    await expect(
      service.create(
        editor,
        {
          title: 'Another campaign',
          imageUrl,
          imageAlt: 'Campaign banner',
          isActive: true,
        } as never,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('supports manual activation and deactivation and delegates public selection', async () => {
    const { service, repository } = setupBannersService();
    const banner = {
      id: 2,
      title: 'Campaign',
      imageUrl,
      imageAlt: 'Campaign banner',
      isActive: false,
    };
    repository.findById.mockResolvedValue({
      ...banner,
      isActive: true,
    });
    repository.setActive.mockResolvedValue(banner);
    repository.findCurrent.mockResolvedValue([
      { id: 2, title: 'Campaign', imageUrl, imageAlt: 'Campaign banner' },
    ]);

    await expect(service.setActive(editor, 2, false)).resolves.toEqual(banner);
    expect(repository.setActive).toHaveBeenCalledWith(2, false, 23, 3);
    await expect(service.findCurrent()).resolves.toEqual([{
      id: 2,
      title: 'Campaign',
      imageUrl,
      imageAlt: 'Campaign banner',
    }]);
  });

  it('rejects activation when the active-banner limit has been reached', async () => {
    const { service, repository } = setupBannersService();
    repository.findById.mockResolvedValue({
      id: 2,
      title: 'Campaign',
      imageUrl,
      imageAlt: 'Campaign banner',
      isActive: false,
    });
    repository.setActive.mockResolvedValue('ACTIVE_LIMIT_REACHED');

    await expect(service.setActive(editor, 2, true)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repository.setActive).toHaveBeenCalledWith(2, true, 23, 3);
  });
});

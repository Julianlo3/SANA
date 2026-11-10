import { UnprocessableEntityException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentRepository } from '../../src/content/content.repository.js';
import { ContentService } from '../../src/content/content.service.js';
import { CreateContentCardDto } from '../../src/content/dto/create-content-card.dto.js';
import { UpdateContentCardDto } from '../../src/content/dto/update-content-card.dto.js';

const editor = { userId: 23 } as never;
const imageUrl = 'https://res.cloudinary.com/sana/image/upload/member.jpg';
const newImageUrl = 'https://res.cloudinary.com/sana/image/upload/member-2.jpg';
const crop = { x: 10, y: 5, width: 40, height: 60 };

function setupContentService() {
  const repository = {
    findItems: vi.fn(),
    findCardById: vi.fn(),
    createCard: vi.fn().mockImplementation((params) => ({ id: 9, ...params })),
    updateCard: vi.fn().mockImplementation((id, patch) => ({ id, ...patch })),
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

function teamMember(overrides: Record<string, unknown> = {}) {
  return {
    section: 'team',
    title: 'Ana',
    subtitle: 'Psychologist',
    imageUrl,
    imageAlt: 'Portrait of Ana',
    teamGroup: 'professional',
    ...overrides,
  };
}

async function errorsOf<T extends object>(cls: new () => T, body: object) {
  const errors = await validate(plainToInstance(cls, body), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return errors.map((error) => error.property);
}

describe('content card DTOs for the team profile', () => {
  it('accepts social URLs only from their own domain', async () => {
    const valid = {
      section: 'team',
      title: 'Ana',
      facebookUrl: 'https://www.facebook.com/ana',
      instagramUrl: 'https://instagram.com/ana',
      linkedinUrl: 'https://co.linkedin.com/in/ana',
    };
    await expect(errorsOf(CreateContentCardDto, valid)).resolves.toEqual([]);

    await expect(
      errorsOf(CreateContentCardDto, {
        section: 'team',
        title: 'Ana',
        facebookUrl: 'https://evil.com/facebook.com/ana',
        instagramUrl: 'http://instagram.com/ana',
        linkedinUrl: 'https://linkedin.com.evil.com/in/ana',
      }),
    ).resolves.toEqual(['facebookUrl', 'instagramUrl', 'linkedinUrl']);
  });

  it('turns empty social URLs into null and lets null clear them on update', async () => {
    const dto = plainToInstance(UpdateContentCardDto, {
      facebookUrl: '  ',
      instagramUrl: null,
    });
    await expect(validate(dto)).resolves.toEqual([]);
    expect(dto.facebookUrl).toBeNull();
    expect(dto.instagramUrl).toBeNull();
  });

  it('validates the team group and the photo crop range', async () => {
    await expect(
      errorsOf(UpdateContentCardDto, { teamGroup: 'volunteers' }),
    ).resolves.toEqual(['teamGroup']);
    await expect(
      errorsOf(UpdateContentCardDto, { photoCrop: { x: -1, y: 0, width: 0, height: 50 } }),
    ).resolves.toEqual(['photoCrop']);
    await expect(
      errorsOf(UpdateContentCardDto, { photoCrop: crop }),
    ).resolves.toEqual([]);
    await expect(
      errorsOf(UpdateContentCardDto, { photoCrop: null }),
    ).resolves.toEqual([]);
  });
});

describe('ContentService team profile rules', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires the group for team members and saves socials and crop', async () => {
    const { service, repository } = setupContentService();

    await expect(
      service.createCard(editor, teamMember({ teamGroup: undefined }) as never),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ fields: ['teamGroup'] }),
    });
    expect(repository.createCard).not.toHaveBeenCalled();

    await service.createCard(
      editor,
      teamMember({ linkedinUrl: 'https://www.linkedin.com/in/ana', photoCrop: crop }) as never,
    );
    expect(repository.createCard).toHaveBeenCalledWith(
      expect.objectContaining({
        teamGroup: 'professional',
        facebookUrl: null,
        instagramUrl: null,
        linkedinUrl: 'https://www.linkedin.com/in/ana',
        photoCrop: crop,
      }),
      23,
    );
  });

  it('rejects team-only fields in other sections', async () => {
    const { service, repository } = setupContentService();

    await expect(
      service.createCard(
        editor,
        { section: 'values', title: 'Respect', teamGroup: 'staff' } as never,
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'TEAM_FIELDS_NOT_ALLOWED' }),
    });

    repository.findCardById.mockResolvedValue({
      id: 3,
      section: 'services',
      title: 'Therapy',
      description: 'Individual sessions',
      imageUrl: null,
      imageAlt: null,
      teamGroup: null,
      photoCrop: null,
    });
    await expect(
      service.updateCard(editor, 3, { instagramUrl: 'https://instagram.com/x' } as never),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(repository.updateCard).not.toHaveBeenCalled();
  });

  it('rejects a crop without a photo or outside the image', async () => {
    const { service, repository } = setupContentService();

    await expect(
      service.createCard(
        editor,
        teamMember({ photoCrop: { x: 70, y: 0, width: 40, height: 50 } }) as never,
      ),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'INVALID_PHOTO_CROP' }),
    });

    repository.findCardById.mockResolvedValue({
      id: 5,
      ...teamMember(),
      description: null,
      photoCrop: crop,
    });
    await expect(
      service.updateCard(editor, 5, { imageUrl: null, photoCrop: crop } as never),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(repository.createCard).not.toHaveBeenCalled();
    expect(repository.updateCard).not.toHaveBeenCalled();
  });

  it('clears the crop when the photo changes unless a new crop is sent', async () => {
    const { service, repository } = setupContentService();
    repository.findCardById.mockResolvedValue({
      id: 5,
      ...teamMember(),
      description: null,
      photoCrop: crop,
    });

    await service.updateCard(editor, 5, { imageUrl: newImageUrl } as never);
    expect(repository.updateCard).toHaveBeenLastCalledWith(
      5,
      expect.objectContaining({ imageUrl: newImageUrl, photoCrop: null }),
      23,
    );

    const newCrop = { x: 0, y: 0, width: 50, height: 50 };
    await service.updateCard(
      editor,
      5,
      { imageUrl: newImageUrl, photoCrop: newCrop } as never,
    );
    expect(repository.updateCard).toHaveBeenLastCalledWith(
      5,
      expect.objectContaining({ photoCrop: newCrop }),
      23,
    );

    await service.updateCard(editor, 5, { title: 'Ana María' } as never);
    expect(repository.updateCard).toHaveBeenLastCalledWith(
      5,
      expect.objectContaining({ photoCrop: undefined }),
      23,
    );
  });

  it('keeps team fields out of the public projection of other sections', async () => {
    const { service, repository } = setupContentService();
    repository.findItems.mockResolvedValue([]);
    repository.findActiveCards.mockResolvedValue([
      {
        id: 1,
        section: 'programs',
        title: 'Program',
        subtitle: null,
        description: 'Description',
        imageUrl: null,
        imageAlt: null,
        teamGroup: null,
        facebookUrl: null,
        instagramUrl: null,
        linkedinUrl: null,
        photoCrop: null,
      },
    ]);

    const content = await service.findPublicContent();
    expect(content.programs[0]).not.toHaveProperty('teamGroup');
    expect(content.programs[0]).not.toHaveProperty('photoCrop');
  });
});

describe('ContentRepository team profile columns', () => {
  it('maps the stored crop columns into a numeric crop object', async () => {
    const row = {
      id: 5,
      section: 'team',
      title: 'Ana',
      teamGroup: 'staff',
      photoCropX: '10.00',
      photoCropY: '5.50',
      photoCropWidth: '40.00',
      photoCropHeight: '60.25',
      editorId: 23,
      editorName: 'Editor',
    };
    const dataSource = {
      query: vi
        .fn()
        .mockResolvedValueOnce([row])
        .mockResolvedValueOnce([{ ...row, photoCropX: null }]),
    };
    const repository = new ContentRepository(dataSource as never);

    await expect(repository.findCardById(5, dataSource as never)).resolves.toMatchObject({
      photoCrop: { x: 10, y: 5.5, width: 40, height: 60.25 },
      updatedBy: { id: 23, name: 'Editor' },
    });
    await expect(repository.findCardById(5, dataSource as never)).resolves.toMatchObject({
      photoCrop: null,
    });
    const [sql] = dataSource.query.mock.calls[0] as [string];
    expect(sql).toContain('cc.cc_team_group AS "teamGroup"');
    expect(sql).toContain('cc.cc_linkedin_url AS "linkedinUrl"');
  });

  it('writes or clears the four crop columns together on update', async () => {
    const manager = {
      query: vi
        .fn()
        .mockResolvedValueOnce([[], 1])
        .mockResolvedValue([]),
    };
    const dataSource = {
      transaction: vi.fn((work: (m: typeof manager) => unknown) => work(manager)),
    };
    const repository = new ContentRepository(dataSource as never);

    await repository.updateCard(5, { photoCrop: null, facebookUrl: null }, 23);

    const [sql, values] = manager.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('cc_facebook_url = $1');
    expect(sql).toContain('cc_photo_crop_x = $2');
    expect(sql).toContain('cc_photo_crop_height = $5');
    expect(values.slice(0, 5)).toEqual([null, null, null, null, null]);
  });
});

import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthenticatedUser } from '../../interfaces/auth.interface.js';
import { DEFAULT_MAX_ACTIVE_BANNERS } from '../content.constants.js';
import { CloudinaryService } from '../images/cloudinary.service.js';
import type {
  BannerListResponse,
  BannerResponse,
  CreateBannerDto,
  PublicBanner,
  UpdateBannerDto,
} from './banners.dto.js';
import {
  ACTIVE_LIMIT_REACHED,
  BannersRepository,
  type BannerFields,
  type BannerPatch,
} from './banners.repository.js';

const NOT_FOUND_MESSAGE = 'El banner no existe';

/**
 * Service with the business rules for home page banners (HU-4.3).
 */
@Injectable()
export class BannersService {
  private readonly logger = new Logger(BannersService.name);
  private readonly maxActive: number;

  constructor(
    private readonly repository: BannersRepository,
    private readonly cloudinaryService: CloudinaryService,
    configService: ConfigService,
  ) {
    const configured = Number(configService.get('BANNERS_MAX_ACTIVE'));
    this.maxActive =
      Number.isInteger(configured) && configured > 0 ? configured : DEFAULT_MAX_ACTIVE_BANNERS;
  }

  /**
   * Finds every banner for the admin panel with the active count and limit.
   * @returns A promise that resolves to the banners and the active counter.
   */
  async findAll(): Promise<BannerListResponse> {
    const [items, activeCount] = await Promise.all([
      this.repository.findAll(),
      this.repository.countActive(),
    ]);
    return { items, activeCount, maxActive: this.maxActive };
  }

  /**
   * Finds the banners to show on the home page right now.
   * @returns A promise that resolves to the current banners.
   */
  findCurrent(): Promise<PublicBanner[]> {
    return this.repository.findCurrent();
  }

  /**
   * Creates a banner, active or as a draft.
   * @param user The authenticated user creating it.
   * @param dto The banner data.
   * @returns A promise that resolves to the created banner.
   */
  async create(user: AuthenticatedUser, dto: CreateBannerDto): Promise<BannerResponse> {
    const fields: BannerFields = {
      title: dto.title,
      imageUrl: dto.imageUrl ?? null,
      imageAlt: dto.imageAlt || null,
      startsAt: dto.startsAt ?? null,
      endsAt: dto.endsAt ?? null,
    };
    const isActive = dto.isActive ?? false;

    ensureConsistent(fields);
    if (isActive) ensureActivatable(fields);
    if (fields.imageUrl) {
      await this.cloudinaryService.ensureValidImage(fields.imageUrl, 'banners');
    }

    const banner = this.unwrap(
      await this.repository.create(fields, isActive, user.userId, this.maxActive),
    );
    this.logger.log(
      `Module:content, Function:createBanner, result-success: userId-${user.userId}, bannerId-${banner.id}, active-${isActive}`,
    );
    return banner;
  }

  /**
   * Edits a banner. An active banner must keep an image and a complete period.
   * @param user The authenticated user making the change.
   * @param id The ID of the banner.
   * @param dto The fields to change.
   * @returns A promise that resolves to the updated banner.
   */
  async update(
    user: AuthenticatedUser,
    id: number,
    dto: UpdateBannerDto,
  ): Promise<BannerResponse> {
    const current = await this.repository.findById(id);
    if (!current) throw new NotFoundException(NOT_FOUND_MESSAGE);

    const patch: BannerPatch = {
      title: dto.title,
      imageUrl: dto.imageUrl,
      imageAlt: dto.imageAlt === undefined ? undefined : dto.imageAlt || null,
      startsAt: dto.startsAt,
      endsAt: dto.endsAt,
    };
    if (patch.imageUrl === null) patch.imageAlt = null;

    const merged: BannerFields = {
      title: patch.title ?? current.title,
      imageUrl: patch.imageUrl === undefined ? current.imageUrl : patch.imageUrl,
      imageAlt: patch.imageAlt === undefined ? current.imageAlt : patch.imageAlt,
      startsAt: patch.startsAt === undefined ? toIso(current.startsAt) : patch.startsAt,
      endsAt: patch.endsAt === undefined ? toIso(current.endsAt) : patch.endsAt,
    };

    ensureConsistent(merged);
    if (current.isActive) ensureActivatable(merged);
    if (patch.imageUrl && patch.imageUrl !== current.imageUrl) {
      await this.cloudinaryService.ensureValidImage(patch.imageUrl, 'banners');
    }

    const takesSlot =
      current.isActive && merged.endsAt !== null && new Date(merged.endsAt) >= new Date();
    const banner = this.unwrap(
      await this.repository.update(id, patch, user.userId, takesSlot ? this.maxActive : null),
    );

    if (current.imageUrl && patch.imageUrl !== undefined && patch.imageUrl !== current.imageUrl) {
      void this.cloudinaryService.deleteImage(current.imageUrl);
    }
    this.logger.log(
      `Module:content, Function:updateBanner, result-success: userId-${user.userId}, bannerId-${id}`,
    );
    return banner;
  }

  /**
   * Activates or deactivates a banner. A deactivated banner stays in the list to be reused.
   * @param user The authenticated user making the change.
   * @param id The ID of the banner.
   * @param isActive The new activation state.
   * @returns A promise that resolves to the updated banner.
   */
  async setActive(
    user: AuthenticatedUser,
    id: number,
    isActive: boolean,
  ): Promise<BannerResponse> {
    const current = await this.repository.findById(id);
    if (!current) throw new NotFoundException(NOT_FOUND_MESSAGE);
    if (isActive) {
      ensureActivatable({
        title: current.title,
        imageUrl: current.imageUrl,
        imageAlt: current.imageAlt,
        startsAt: toIso(current.startsAt),
        endsAt: toIso(current.endsAt),
      });
    }

    const banner = this.unwrap(
      await this.repository.setActive(id, isActive, user.userId, this.maxActive),
    );
    this.logger.log(
      `Module:content, Function:setBannerActive, result-success: userId-${user.userId}, bannerId-${id}, active-${isActive}`,
    );
    return banner;
  }

  /**
   * Permanently deletes a banner. It must be deactivated first.
   * @param user The authenticated user deleting it.
   * @param id The ID of the banner.
   */
  async delete(user: AuthenticatedUser, id: number): Promise<void> {
    const current = await this.repository.findById(id);
    if (!current) throw new NotFoundException(NOT_FOUND_MESSAGE);

    const wasDeleted =
      !current.isActive && (await this.repository.deleteInactive(id, user.userId));
    if (!wasDeleted) {
      throw new ConflictException({
        error: 'BANNER_ACTIVE',
        message: 'Desactiva el banner antes de eliminarlo',
      });
    }
    if (current.imageUrl) void this.cloudinaryService.deleteImage(current.imageUrl);

    this.logger.log(
      `Module:content, Function:deleteBanner, result-success: userId-${user.userId}, bannerId-${id}`,
    );
  }

  private unwrap(
    result: BannerResponse | null | typeof ACTIVE_LIMIT_REACHED,
  ): BannerResponse {
    if (result === ACTIVE_LIMIT_REACHED) {
      throw new ConflictException({
        error: 'ACTIVE_BANNERS_LIMIT',
        message: `Ya hay ${this.maxActive} banners activos. Desactiva uno para activar este.`,
      });
    }
    if (!result) throw new NotFoundException(NOT_FOUND_MESSAGE);
    return result;
  }
}

function toIso(date: Date | null): string | null {
  return date ? new Date(date).toISOString() : null;
}

function ensureConsistent(fields: BannerFields): void {
  if (fields.imageUrl && !fields.imageAlt) {
    throw new UnprocessableEntityException({
      error: 'MISSING_REQUIRED_FIELDS',
      message: 'Faltan campos obligatorios: descripción de la imagen',
      fields: ['imageAlt'],
    });
  }
  if (fields.startsAt && fields.endsAt && new Date(fields.endsAt) <= new Date(fields.startsAt)) {
    throw new UnprocessableEntityException({
      error: 'INVALID_PERIOD',
      message: 'La fecha de fin debe ser posterior a la fecha de inicio',
    });
  }
}

function ensureActivatable(fields: BannerFields): void {
  const missing: [string, string][] = [];
  if (!fields.imageUrl) missing.push(['imageUrl', 'imagen']);
  if (!fields.startsAt) missing.push(['startsAt', 'fecha de inicio']);
  if (!fields.endsAt) missing.push(['endsAt', 'fecha de fin']);

  if (missing.length > 0) {
    throw new UnprocessableEntityException({
      error: 'MISSING_REQUIRED_FIELDS',
      message: `Para activar el banner falta: ${missing.map(([, label]) => label).join(', ')}`,
      fields: missing.map(([field]) => field),
    });
  }
  if (new Date(fields.endsAt as string) < new Date()) {
    throw new UnprocessableEntityException({
      error: 'PERIOD_ENDED',
      message: 'La vigencia ya terminó. Cambia la fecha de fin para activarlo.',
    });
  }
}

import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../../interfaces/auth.interface.js';
import type { PublicationStatus } from '../content.constants.js';
import { CloudinaryService } from '../images/cloudinary.service.js';
import type {
  CreateGalleryImageDto,
  GalleryImageResponse,
  PublicGalleryImage,
  UpdateGalleryImageDto,
} from './gallery.dto.js';
import { GalleryRepository } from './gallery.repository.js';

const NOT_FOUND_MESSAGE = 'La imagen no existe';

/**
 * Service with the business rules for the gallery (HU-4.2).
 */
@Injectable()
export class GalleryService {
  private readonly logger = new Logger(GalleryService.name);

  constructor(
    private readonly repository: GalleryRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Finds every gallery image for the admin panel.
   * @returns A promise that resolves to the images, including retired ones.
   */
  findAll(): Promise<GalleryImageResponse[]> {
    return this.repository.findAll();
  }

  /**
   * Finds the published images for the public site.
   * @returns A promise that resolves to the published images.
   */
  findPublished(): Promise<PublicGalleryImage[]> {
    return this.repository.findPublished();
  }

  /**
   * Adds an image to the gallery after verifying it in the image storage.
   * @param user The authenticated user adding it.
   * @param dto The image data.
   * @returns A promise that resolves to the created image.
   */
  async create(
    user: AuthenticatedUser,
    dto: CreateGalleryImageDto,
  ): Promise<GalleryImageResponse> {
    await this.cloudinaryService.ensureValidImage(dto.imageUrl, 'gallery');

    const image = await this.repository.create(
      { imageUrl: dto.imageUrl, imageAlt: dto.imageAlt, caption: dto.caption || null },
      user.userId,
    );
    this.logger.log(
      `Module:content, Function:createGalleryImage, result-success: userId-${user.userId}, imageId-${image.id}`,
    );
    return image;
  }

  /**
   * Edits the description, caption or position of a gallery image.
   * @param user The authenticated user making the change.
   * @param id The ID of the image.
   * @param dto The fields to change.
   * @returns A promise that resolves to the updated image.
   */
  async update(
    user: AuthenticatedUser,
    id: number,
    dto: UpdateGalleryImageDto,
  ): Promise<GalleryImageResponse> {
    const image = await this.repository.update(
      id,
      {
        imageAlt: dto.imageAlt,
        caption: dto.caption === undefined ? undefined : dto.caption || null,
        order: dto.order,
      },
      user.userId,
    );
    if (!image) throw new NotFoundException(NOT_FOUND_MESSAGE);

    this.logger.log(
      `Module:content, Function:updateGalleryImage, result-success: userId-${user.userId}, imageId-${id}`,
    );
    return image;
  }

  /**
   * Publishes or retires a gallery image. Retired images stay in the admin list.
   * @param user The authenticated user making the change.
   * @param id The ID of the image.
   * @param status The new status.
   * @returns A promise that resolves to the updated image.
   */
  async setStatus(
    user: AuthenticatedUser,
    id: number,
    status: PublicationStatus,
  ): Promise<GalleryImageResponse> {
    const image = await this.repository.setStatus(id, status, user.userId);
    if (!image) throw new NotFoundException(NOT_FOUND_MESSAGE);

    this.logger.log(
      `Module:content, Function:setGalleryImageStatus, result-success: userId-${user.userId}, imageId-${id}, status-${status}`,
    );
    return image;
  }

  /**
   * Permanently deletes a gallery image. It must be retired first.
   * @param user The authenticated user deleting it.
   * @param id The ID of the image.
   */
  async delete(user: AuthenticatedUser, id: number): Promise<void> {
    const current = await this.repository.findById(id);
    if (!current) throw new NotFoundException(NOT_FOUND_MESSAGE);

    const wasDeleted =
      current.status === 'retired' &&
      (await this.repository.deleteRetired(id, user.userId));
    if (!wasDeleted) {
      throw new ConflictException({
        error: 'GALLERY_IMAGE_NOT_RETIRED',
        message: 'Retira la imagen del sitio antes de eliminarla',
      });
    }

    this.logger.log(
      `Module:content, Function:deleteGalleryImage, result-success: userId-${user.userId}, imageId-${id}`,
    );
  }
}

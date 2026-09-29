import { Injectable } from '@nestjs/common';
import { DataSource, type EntityManager } from 'typeorm';
import { logContentChange } from '../content-change-log.js';
import type { PublicationStatus } from '../content.constants.js';
import type { GalleryImageResponse, PublicGalleryImage } from './gallery.dto.js';

interface GalleryImageRow extends Omit<GalleryImageResponse, 'updatedBy'> {
  editorId: number;
  editorName: string;
}

export interface GalleryImagePatch {
  imageAlt?: string;
  caption?: string | null;
  order?: number;
}

const PATCH_COLUMNS: Record<keyof GalleryImagePatch, string> = {
  imageAlt: 'gi_image_alt',
  caption: 'gi_caption',
  order: 'gi_order',
};

const GALLERY_SELECT = `
  SELECT
    g.gi_id AS "id",
    g.gi_image_url AS "imageUrl",
    g.gi_image_alt AS "imageAlt",
    g.gi_caption AS "caption",
    g.gi_status AS "status",
    g.gi_order AS "order",
    g.gi_updated_at AS "updatedAt",
    p.per_id AS "editorId",
    p.per_name AS "editorName"
  FROM gallery_images g
  JOIN person p ON p.per_id = g.gi_updated_by`;

/**
 * Repository for gallery images and their change log.
 */
@Injectable()
export class GalleryRepository {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Finds every gallery image for the admin panel, including retired ones.
   * @returns A promise that resolves to the images by position.
   */
  async findAll(): Promise<GalleryImageResponse[]> {
    const rows = await this.dataSource.query<GalleryImageRow[]>(
      `${GALLERY_SELECT} ORDER BY g.gi_order, g.gi_id`,
    );
    return rows.map(toGalleryImageResponse);
  }

  /**
   * Finds a gallery image by its ID.
   * @param id The ID of the image.
   * @returns A promise that resolves to the image or null.
   */
  async findById(
    id: number,
    manager: EntityManager = this.dataSource.manager,
  ): Promise<GalleryImageResponse | null> {
    const rows = await manager.query<GalleryImageRow[]>(
      `${GALLERY_SELECT} WHERE g.gi_id = $1`,
      [id],
    );
    return rows[0] ? toGalleryImageResponse(rows[0]) : null;
  }

  /**
   * Finds the published images for the public site.
   * @returns A promise that resolves to the images by position.
   */
  async findPublished(): Promise<PublicGalleryImage[]> {
    return this.dataSource.query<PublicGalleryImage[]>(
      `SELECT
         gi_id AS "id",
         gi_image_url AS "imageUrl",
         gi_image_alt AS "imageAlt",
         gi_caption AS "caption"
       FROM gallery_images
       WHERE gi_status = 'published'
       ORDER BY gi_order, gi_id`,
    );
  }

  /**
   * Adds a published image at the end of the gallery.
   * @param params The image data.
   * @param userId The ID of the user adding it.
   * @returns A promise that resolves to the created image.
   */
  async create(
    params: { imageUrl: string; imageAlt: string; caption: string | null },
    userId: number,
  ): Promise<GalleryImageResponse> {
    return this.dataSource.transaction(async (manager) => {
      const rows = await manager.query<{ id: number }[]>(
        `INSERT INTO gallery_images (
           gi_image_url, gi_image_alt, gi_caption, gi_order, gi_created_by, gi_updated_by
         )
         VALUES (
           $1, $2, $3,
           (SELECT COALESCE(MAX(gi_order) + 1, 0) FROM gallery_images),
           $4, $4
         )
         RETURNING gi_id AS "id"`,
        [params.imageUrl, params.imageAlt, params.caption, userId],
      );
      const id = rows[0].id;
      await logContentChange(manager, userId, 'gallery_image', id, 'create');
      return (await this.findById(id, manager)) as GalleryImageResponse;
    });
  }

  /**
   * Updates the given fields of a gallery image.
   * @param id The ID of the image.
   * @param patch The fields to change.
   * @param userId The ID of the user making the change.
   * @returns A promise that resolves to the updated image or null if it does not exist.
   */
  async update(
    id: number,
    patch: GalleryImagePatch,
    userId: number,
  ): Promise<GalleryImageResponse | null> {
    return this.dataSource.transaction(async (manager) => {
      const assignments: string[] = [];
      const values: unknown[] = [];

      for (const field of Object.keys(PATCH_COLUMNS) as (keyof GalleryImagePatch)[]) {
        if (patch[field] === undefined) continue;
        values.push(patch[field]);
        assignments.push(`${PATCH_COLUMNS[field]} = $${values.length}`);
      }

      values.push(userId, id);
      const [, affected] = await manager.query<[unknown[], number]>(
        `UPDATE gallery_images
         SET ${[...assignments, `gi_updated_by = $${values.length - 1}`, 'gi_updated_at = now()'].join(', ')}
         WHERE gi_id = $${values.length}`,
        values,
      );
      if (affected === 0) return null;

      await logContentChange(manager, userId, 'gallery_image', id, 'update');
      return this.findById(id, manager);
    });
  }

  /**
   * Publishes or retires a gallery image.
   * @param id The ID of the image.
   * @param status The new status.
   * @param userId The ID of the user making the change.
   * @returns A promise that resolves to the updated image or null if it does not exist.
   */
  async setStatus(
    id: number,
    status: PublicationStatus,
    userId: number,
  ): Promise<GalleryImageResponse | null> {
    return this.dataSource.transaction(async (manager) => {
      const [, affected] = await manager.query<[unknown[], number]>(
        `UPDATE gallery_images
         SET gi_status = $1, gi_updated_by = $2, gi_updated_at = now()
         WHERE gi_id = $3`,
        [status, userId, id],
      );
      if (affected === 0) return null;

      await logContentChange(
        manager,
        userId,
        'gallery_image',
        id,
        status === 'published' ? 'publish' : 'retire',
      );
      return this.findById(id, manager);
    });
  }

  /**
   * Permanently deletes a retired gallery image. Published images cannot be deleted.
   * @param id The ID of the image.
   * @param userId The ID of the user deleting it.
   * @returns A promise that resolves to true if the image was deleted.
   */
  async deleteRetired(id: number, userId: number): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      const [, affected] = await manager.query<[unknown[], number]>(
        `DELETE FROM gallery_images WHERE gi_id = $1 AND gi_status = 'retired'`,
        [id],
      );
      if (affected === 0) return false;

      await logContentChange(manager, userId, 'gallery_image', id, 'delete');
      return true;
    });
  }
}

function toGalleryImageResponse(row: GalleryImageRow): GalleryImageResponse {
  const { editorId, editorName, ...image } = row;
  return { ...image, updatedBy: { id: editorId, name: editorName } };
}

import { Injectable } from '@nestjs/common';
import { DataSource, type EntityManager } from 'typeorm';
import { logContentChange } from '../content-change-log.js';
import type { BannerResponse, PublicBanner } from './banners.dto.js';

interface BannerRow extends Omit<BannerResponse, 'updatedBy'> {
  editorId: number;
  editorName: string;
}

export interface BannerFields {
  title: string;
  imageUrl: string | null;
  imageAlt: string | null;
  startsAt: string | null;
  endsAt: string | null;
}

export type BannerPatch = Partial<BannerFields>;

export const ACTIVE_LIMIT_REACHED = 'ACTIVE_LIMIT_REACHED';

const PATCH_COLUMNS: Record<keyof BannerPatch, string> = {
  title: 'ban_title',
  imageUrl: 'ban_image_url',
  imageAlt: 'ban_image_alt',
  startsAt: 'ban_starts_at',
  endsAt: 'ban_ends_at',
};

const BANNER_SELECT = `
  SELECT
    b.ban_id AS "id",
    b.ban_title AS "title",
    b.ban_image_url AS "imageUrl",
    b.ban_image_alt AS "imageAlt",
    b.ban_starts_at AS "startsAt",
    b.ban_ends_at AS "endsAt",
    b.ban_is_active AS "isActive",
    CASE
      WHEN NOT b.ban_is_active THEN 'inactive'
      WHEN now() < b.ban_starts_at THEN 'scheduled'
      WHEN now() > b.ban_ends_at THEN 'expired'
      ELSE 'current'
    END AS "state",
    b.ban_updated_at AS "updatedAt",
    p.per_id AS "editorId",
    p.per_name AS "editorName"
  FROM banners b
  JOIN person p ON p.per_id = b.ban_updated_by`;

/**
 * Repository for home page banners. The period is resolved by date on every query, so expired
 * banners stop showing without any scheduled job.
 */
@Injectable()
export class BannersRepository {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Finds every banner for the admin panel.
   * @returns A promise that resolves to the banners, active first.
   */
  async findAll(): Promise<BannerResponse[]> {
    const rows = await this.dataSource.query<BannerRow[]>(
      `${BANNER_SELECT}
       ORDER BY b.ban_is_active DESC, b.ban_starts_at DESC NULLS LAST, b.ban_id DESC`,
    );
    return rows.map(toBannerResponse);
  }

  /**
   * Finds a banner by its ID.
   * @param id The ID of the banner.
   * @returns A promise that resolves to the banner or null.
   */
  async findById(
    id: number,
    manager: EntityManager = this.dataSource.manager,
  ): Promise<BannerResponse | null> {
    const rows = await manager.query<BannerRow[]>(`${BANNER_SELECT} WHERE b.ban_id = $1`, [id]);
    return rows[0] ? toBannerResponse(rows[0]) : null;
  }

  /**
   * Counts the active banners that have not expired yet (current or scheduled).
   * @param excludeId Optional banner to leave out of the count.
   * @returns A promise that resolves to the number of active banners.
   */
  async countActive(
    excludeId: number | null = null,
    manager: EntityManager = this.dataSource.manager,
  ): Promise<number> {
    const rows = await manager.query<{ total: number }[]>(
      `SELECT COUNT(*)::int AS "total"
       FROM banners
       WHERE ban_is_active AND ban_ends_at >= now()
         AND ($1::int IS NULL OR ban_id <> $1::int)`,
      [excludeId],
    );
    return rows[0]?.total ?? 0;
  }

  /**
   * Finds the banners to show right now on the home page.
   * @returns A promise that resolves to the active banners within their period.
   */
  async findCurrent(): Promise<PublicBanner[]> {
    return this.dataSource.query<PublicBanner[]>(
      `SELECT
         ban_id AS "id",
         ban_title AS "title",
         ban_image_url AS "imageUrl",
         ban_image_alt AS "imageAlt"
       FROM banners
       WHERE ban_is_active AND now() BETWEEN ban_starts_at AND ban_ends_at
       ORDER BY ban_starts_at, ban_id`,
    );
  }

  /**
   * Creates a banner. When it is created active, the active limit is checked under a lock.
   * @param fields The banner data.
   * @param isActive Whether the banner is created active.
   * @param userId The ID of the user creating it.
   * @param maxActive The maximum number of active banners.
   * @returns A promise that resolves to the banner, or ACTIVE_LIMIT_REACHED.
   */
  async create(
    fields: BannerFields,
    isActive: boolean,
    userId: number,
    maxActive: number,
  ): Promise<BannerResponse | typeof ACTIVE_LIMIT_REACHED> {
    return this.dataSource.transaction(async (manager) => {
      if (isActive && (await this.isLimitReached(manager, null, maxActive))) {
        return ACTIVE_LIMIT_REACHED;
      }

      const rows = await manager.query<{ id: number }[]>(
        `INSERT INTO banners (
           ban_title, ban_image_url, ban_image_alt, ban_starts_at, ban_ends_at,
           ban_is_active, ban_created_by, ban_updated_by
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
         RETURNING ban_id AS "id"`,
        [
          fields.title,
          fields.imageUrl,
          fields.imageAlt,
          fields.startsAt,
          fields.endsAt,
          isActive,
          userId,
        ],
      );
      const id = rows[0].id;
      await logContentChange(manager, userId, 'banner', id, 'create');
      return (await this.findById(id, manager)) as BannerResponse;
    });
  }

  /**
   * Updates the given fields of a banner.
   * @param id The ID of the banner.
   * @param patch The fields to change.
   * @param userId The ID of the user making the change.
   * @param maxActive The maximum number of active banners, or null when the change cannot take a new slot.
   * @returns A promise that resolves to the banner, null if it does not exist, or ACTIVE_LIMIT_REACHED.
   */
  async update(
    id: number,
    patch: BannerPatch,
    userId: number,
    maxActive: number | null,
  ): Promise<BannerResponse | null | typeof ACTIVE_LIMIT_REACHED> {
    return this.dataSource.transaction(async (manager) => {
      if (maxActive !== null && (await this.isLimitReached(manager, id, maxActive))) {
        return ACTIVE_LIMIT_REACHED;
      }

      const assignments: string[] = [];
      const values: unknown[] = [];
      for (const field of Object.keys(PATCH_COLUMNS) as (keyof BannerPatch)[]) {
        if (patch[field] === undefined) continue;
        values.push(patch[field]);
        assignments.push(`${PATCH_COLUMNS[field]} = $${values.length}`);
      }

      values.push(userId, id);
      const [, affected] = await manager.query<[unknown[], number]>(
        `UPDATE banners
         SET ${[...assignments, `ban_updated_by = $${values.length - 1}`, 'ban_updated_at = now()'].join(', ')}
         WHERE ban_id = $${values.length}`,
        values,
      );
      if (affected === 0) return null;

      await logContentChange(manager, userId, 'banner', id, 'update');
      return this.findById(id, manager);
    });
  }

  /**
   * Activates or deactivates a banner. Activation checks the active limit under a lock.
   * @param id The ID of the banner.
   * @param isActive The new activation state.
   * @param userId The ID of the user making the change.
   * @param maxActive The maximum number of active banners.
   * @returns A promise that resolves to the banner, null if it does not exist, or ACTIVE_LIMIT_REACHED.
   */
  async setActive(
    id: number,
    isActive: boolean,
    userId: number,
    maxActive: number,
  ): Promise<BannerResponse | null | typeof ACTIVE_LIMIT_REACHED> {
    return this.dataSource.transaction(async (manager) => {
      if (isActive && (await this.isLimitReached(manager, id, maxActive))) {
        return ACTIVE_LIMIT_REACHED;
      }

      const [, affected] = await manager.query<[unknown[], number]>(
        `UPDATE banners
         SET ban_is_active = $1, ban_updated_by = $2, ban_updated_at = now()
         WHERE ban_id = $3`,
        [isActive, userId, id],
      );
      if (affected === 0) return null;

      await logContentChange(manager, userId, 'banner', id, isActive ? 'activate' : 'deactivate');
      return this.findById(id, manager);
    });
  }

  /**
   * Permanently deletes an inactive banner. Active banners cannot be deleted.
   * @param id The ID of the banner.
   * @param userId The ID of the user deleting it.
   * @returns A promise that resolves to true if the banner was deleted.
   */
  async deleteInactive(id: number, userId: number): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      const [, affected] = await manager.query<[unknown[], number]>(
        `DELETE FROM banners WHERE ban_id = $1 AND NOT ban_is_active`,
        [id],
      );
      if (affected === 0) return false;

      await logContentChange(manager, userId, 'banner', id, 'delete');
      return true;
    });
  }

  private async isLimitReached(
    manager: EntityManager,
    excludeId: number | null,
    maxActive: number,
  ): Promise<boolean> {
    await manager.query(`SELECT pg_advisory_xact_lock(hashtext('content_banners_activation'))`);
    return (await this.countActive(excludeId, manager)) >= maxActive;
  }
}

function toBannerResponse(row: BannerRow): BannerResponse {
  const { editorId, editorName, ...banner } = row;
  return { ...banner, updatedBy: { id: editorId, name: editorName } };
}

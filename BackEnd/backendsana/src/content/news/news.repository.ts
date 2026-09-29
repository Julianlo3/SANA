import { Injectable } from '@nestjs/common';
import { DataSource, type EntityManager } from 'typeorm';
import { logContentChange } from '../content-change-log.js';
import type { PublicationStatus } from '../content.constants.js';
import type { NewsResponse, PublicNews } from './news.dto.js';

interface NewsRow extends Omit<NewsResponse, 'createdBy' | 'updatedBy'> {
  creatorId: number;
  creatorName: string;
  editorId: number;
  editorName: string;
}

export interface NewsWriteParams {
  title: string;
  body: string;
  imageUrl: string | null;
  imageAlt: string | null;
}

export type NewsPatch = Partial<NewsWriteParams>;

const PATCH_COLUMNS: Record<keyof NewsPatch, string> = {
  title: 'nw_title',
  body: 'nw_body',
  imageUrl: 'nw_image_url',
  imageAlt: 'nw_image_alt',
};

const PUBLIC_ORDER = 'nw_is_pinned DESC, nw_published_at DESC, nw_id DESC';

const PUBLIC_COLUMNS = `
  nw_id AS "id",
  nw_title AS "title",
  nw_body AS "body",
  nw_image_url AS "imageUrl",
  nw_image_alt AS "imageAlt",
  nw_is_pinned AS "isPinned",
  nw_published_at AS "publishedAt"`;

const NEWS_SELECT = `
  SELECT
    ${PUBLIC_COLUMNS},
    n.nw_status AS "status",
    n.nw_updated_at AS "updatedAt",
    pc.per_id AS "creatorId",
    pc.per_name AS "creatorName",
    pu.per_id AS "editorId",
    pu.per_name AS "editorName"
  FROM news n
  JOIN person pc ON pc.per_id = n.nw_created_by
  JOIN person pu ON pu.per_id = n.nw_updated_by`;

/**
 * Repository for news items and their change log.
 */
@Injectable()
export class NewsRepository {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Finds every news item for the admin panel, including retired ones.
   * @returns A promise that resolves to the news, pinned first and newest first.
   */
  async findAll(): Promise<NewsResponse[]> {
    const rows = await this.dataSource.query<NewsRow[]>(
      `${NEWS_SELECT} ORDER BY ${PUBLIC_ORDER}`,
    );
    return rows.map(toNewsResponse);
  }

  /**
   * Finds a news item by its ID.
   * @param id The ID of the news item.
   * @returns A promise that resolves to the news item or null.
   */
  async findById(
    id: number,
    manager: EntityManager = this.dataSource.manager,
  ): Promise<NewsResponse | null> {
    const rows = await manager.query<NewsRow[]>(`${NEWS_SELECT} WHERE n.nw_id = $1`, [id]);
    return rows[0] ? toNewsResponse(rows[0]) : null;
  }

  /**
   * Finds a page of published news for the public site.
   * @param limit The page size.
   * @param offset The number of items to skip.
   * @returns A promise that resolves to the items and the total of published news.
   */
  async findPublished(
    limit: number,
    offset: number,
  ): Promise<{ items: PublicNews[]; total: number }> {
    const [items, count] = await Promise.all([
      this.dataSource.query<PublicNews[]>(
        `SELECT ${PUBLIC_COLUMNS}
         FROM news
         WHERE nw_status = 'published'
         ORDER BY ${PUBLIC_ORDER}
         LIMIT $1 OFFSET $2`,
        [limit, offset],
      ),
      this.dataSource.query<{ total: number }[]>(
        `SELECT COUNT(*)::int AS "total" FROM news WHERE nw_status = 'published'`,
      ),
    ]);
    return { items, total: count[0]?.total ?? 0 };
  }

  /**
   * Finds a published news item for the public site.
   * @param id The ID of the news item.
   * @returns A promise that resolves to the news item or null if it does not exist or was retired.
   */
  async findPublishedById(id: number): Promise<PublicNews | null> {
    const rows = await this.dataSource.query<PublicNews[]>(
      `SELECT ${PUBLIC_COLUMNS} FROM news WHERE nw_id = $1 AND nw_status = 'published'`,
      [id],
    );
    return rows[0] ?? null;
  }

  /**
   * Publishes a news item with the current date.
   * @param params The news data.
   * @param userId The ID of the user publishing it.
   * @returns A promise that resolves to the created news item.
   */
  async create(params: NewsWriteParams, userId: number): Promise<NewsResponse> {
    return this.dataSource.transaction(async (manager) => {
      const rows = await manager.query<{ id: number }[]>(
        `INSERT INTO news (nw_title, nw_body, nw_image_url, nw_image_alt, nw_created_by, nw_updated_by)
         VALUES ($1, $2, $3, $4, $5, $5)
         RETURNING nw_id AS "id"`,
        [params.title, params.body, params.imageUrl, params.imageAlt, userId],
      );
      const id = rows[0].id;
      await logContentChange(manager, userId, 'news', id, 'create');
      return (await this.findById(id, manager)) as NewsResponse;
    });
  }

  /**
   * Updates the given fields of a news item. The publication date does not change.
   * @param id The ID of the news item.
   * @param patch The fields to change.
   * @param userId The ID of the user making the change.
   * @returns A promise that resolves to the updated news item or null if it does not exist.
   */
  async update(id: number, patch: NewsPatch, userId: number): Promise<NewsResponse | null> {
    return this.dataSource.transaction(async (manager) => {
      const assignments: string[] = [];
      const values: unknown[] = [];

      for (const field of Object.keys(PATCH_COLUMNS) as (keyof NewsPatch)[]) {
        if (patch[field] === undefined) continue;
        values.push(patch[field]);
        assignments.push(`${PATCH_COLUMNS[field]} = $${values.length}`);
      }

      values.push(userId, id);
      const [, affected] = await manager.query<[unknown[], number]>(
        `UPDATE news
         SET ${[...assignments, `nw_updated_by = $${values.length - 1}`, 'nw_updated_at = now()'].join(', ')}
         WHERE nw_id = $${values.length}`,
        values,
      );
      if (affected === 0) return null;

      await logContentChange(manager, userId, 'news', id, 'update');
      return this.findById(id, manager);
    });
  }

  /**
   * Publishes or retires a news item. Retiring also unpins it.
   * @param id The ID of the news item.
   * @param status The new status.
   * @param userId The ID of the user making the change.
   * @returns A promise that resolves to the updated news item or null if it does not exist.
   */
  async setStatus(
    id: number,
    status: PublicationStatus,
    userId: number,
  ): Promise<NewsResponse | null> {
    return this.dataSource.transaction(async (manager) => {
      const [, affected] = await manager.query<[unknown[], number]>(
        `UPDATE news
         SET nw_status = $1::varchar,
             nw_is_pinned = CASE WHEN $1::varchar = 'retired' THEN false ELSE nw_is_pinned END,
             nw_updated_by = $2,
             nw_updated_at = now()
         WHERE nw_id = $3`,
        [status, userId, id],
      );
      if (affected === 0) return null;

      await logContentChange(
        manager,
        userId,
        'news',
        id,
        status === 'published' ? 'publish' : 'retire',
      );
      return this.findById(id, manager);
    });
  }

  /**
   * Pins or unpins a published news item. Pinning unpins the previously pinned one.
   * @param id The ID of the news item.
   * @param isPinned Whether the item must be pinned.
   * @param userId The ID of the user making the change.
   * @returns A promise that resolves to the updated news item or null if it is not published.
   */
  async setPinned(
    id: number,
    isPinned: boolean,
    userId: number,
  ): Promise<NewsResponse | null> {
    return this.dataSource.transaction(async (manager) => {
      if (isPinned) {
        const [previous] = await manager.query<[{ id: number }[], number]>(
          `UPDATE news
           SET nw_is_pinned = false, nw_updated_by = $1, nw_updated_at = now()
           WHERE nw_is_pinned AND nw_id <> $2
           RETURNING nw_id AS "id"`,
          [userId, id],
        );
        for (const row of previous) {
          await logContentChange(manager, userId, 'news', row.id, 'unpin');
        }
      }

      const [, affected] = await manager.query<[unknown[], number]>(
        `UPDATE news
         SET nw_is_pinned = $1, nw_updated_by = $2, nw_updated_at = now()
         WHERE nw_id = $3 AND nw_status = 'published'`,
        [isPinned, userId, id],
      );
      if (affected === 0) return null;

      await logContentChange(manager, userId, 'news', id, isPinned ? 'pin' : 'unpin');
      return this.findById(id, manager);
    });
  }
}

function toNewsResponse(row: NewsRow): NewsResponse {
  const { creatorId, creatorName, editorId, editorName, ...news } = row;
  return {
    ...news,
    createdBy: { id: creatorId, name: creatorName },
    updatedBy: { id: editorId, name: editorName },
  };
}

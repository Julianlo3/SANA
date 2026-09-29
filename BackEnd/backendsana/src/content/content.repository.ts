import { Injectable } from '@nestjs/common';
import { DataSource, type EntityManager } from 'typeorm';
import {
  CONTENT_ITEM_KEYS,
  type ContentAction,
  type ContentCardSection,
  type ContentItemKey,
  type ContentType,
} from './content.constants.js';
import type {
  ContentCardResponse,
  ContentItemResponse,
} from './dto/content-response.dto.js';

interface ContentCardRow extends Omit<ContentCardResponse, 'updatedBy'> {
  editorId: number;
  editorName: string;
}

interface ContentItemRow {
  key: ContentItemKey;
  value: string | null;
  updatedAt: Date;
  editorId: number | null;
  editorName: string | null;
}

export interface ContentCardWriteParams {
  section: ContentCardSection;
  title: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  order: number | null;
  isActive: boolean;
}

export type ContentCardPatch = Partial<Omit<ContentCardWriteParams, 'section'>>;

const CARD_PATCH_COLUMNS: Record<keyof ContentCardPatch, string> = {
  title: 'cc_title',
  subtitle: 'cc_subtitle',
  description: 'cc_description',
  imageUrl: 'cc_image_url',
  imageAlt: 'cc_image_alt',
  order: 'cc_order',
  isActive: 'cc_is_active',
};

const CARD_SELECT = `
  SELECT
    cc.cc_id AS "id",
    cc.cc_section AS "section",
    cc.cc_title AS "title",
    cc.cc_subtitle AS "subtitle",
    cc.cc_description AS "description",
    cc.cc_image_url AS "imageUrl",
    cc.cc_image_alt AS "imageAlt",
    cc.cc_order AS "order",
    cc.cc_is_active AS "isActive",
    cc.cc_updated_at AS "updatedAt",
    p.per_id AS "editorId",
    p.per_name AS "editorName"
  FROM content_cards cc
  JOIN person p ON p.per_id = cc.cc_updated_by`;

/**
 * Repository for institutional content (content items and content cards) and its change log.
 */
@Injectable()
export class ContentRepository {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Finds the editable single-value items, including keys that have never been saved.
   * @returns A promise that resolves to one entry per allowed key.
   */
  async findItems(): Promise<ContentItemResponse[]> {
    const rows = await this.dataSource.query<ContentItemRow[]>(
      `SELECT
         ci.ci_key AS "key",
         ci.ci_text_value AS "value",
         ci.ci_updated_at AS "updatedAt",
         p.per_id AS "editorId",
         p.per_name AS "editorName"
       FROM content_items ci
       LEFT JOIN person p ON p.per_id = ci.mar_id
       WHERE ci.ci_key = ANY($1)`,
      [CONTENT_ITEM_KEYS],
    );

    return CONTENT_ITEM_KEYS.map((key) => {
      const row = rows.find((item) => item.key === key);
      return {
        key,
        value: row?.value ?? null,
        updatedAt: row?.updatedAt ?? null,
        updatedBy:
          row?.editorId != null
            ? { id: row.editorId, name: row.editorName ?? '' }
            : null,
      };
    });
  }

  /**
   * Creates or updates text items and records each change for the given user.
   * @param items The keys and values to save.
   * @param userId The ID of the user making the change.
   */
  async saveItems(
    items: { key: ContentItemKey; value: string }[],
    userId: number,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      for (const item of items) {
        const rows = await manager.query<{ id: number; inserted: boolean }[]>(
          `INSERT INTO content_items (ci_key, ci_type, ci_text_value, mar_id, ci_updated_at)
           VALUES ($1, 'text', $2, $3, now())
           ON CONFLICT (ci_key) DO UPDATE
             SET ci_text_value = EXCLUDED.ci_text_value,
                 mar_id = EXCLUDED.mar_id,
                 ci_updated_at = now()
           RETURNING ci_id AS "id", (xmax = 0) AS "inserted"`,
          [item.key, item.value, userId],
        );
        await this.logChange(
          manager,
          userId,
          'content_item',
          rows[0].id,
          rows[0].inserted ? 'create' : 'update',
        );
      }
    });
  }

  /**
   * Finds content cards for the admin panel, active or not.
   * @param section Optional section to filter by.
   * @returns A promise that resolves to the cards ordered by section and position.
   */
  async findCards(section?: ContentCardSection): Promise<ContentCardResponse[]> {
    const rows = await this.dataSource.query<ContentCardRow[]>(
      `${CARD_SELECT}
       WHERE ($1::varchar IS NULL OR cc.cc_section = $1)
       ORDER BY cc.cc_section, cc.cc_order, cc.cc_id`,
      [section ?? null],
    );
    return rows.map(toCardResponse);
  }

  /**
   * Finds a content card by its ID.
   * @param id The ID of the card.
   * @returns A promise that resolves to the card or null if it does not exist.
   */
  async findCardById(
    id: number,
    manager: EntityManager = this.dataSource.manager,
  ): Promise<ContentCardResponse | null> {
    const rows = await manager.query<ContentCardRow[]>(
      `${CARD_SELECT} WHERE cc.cc_id = $1`,
      [id],
    );
    return rows[0] ? toCardResponse(rows[0]) : null;
  }

  /**
   * Creates a content card at the end of its section unless an order is given.
   * @param params The card data.
   * @param userId The ID of the user creating the card.
   * @returns A promise that resolves to the created card.
   */
  async createCard(
    params: ContentCardWriteParams,
    userId: number,
  ): Promise<ContentCardResponse> {
    return this.dataSource.transaction(async (manager) => {
      const rows = await manager.query<{ id: number }[]>(
        `INSERT INTO content_cards (
           cc_section, cc_title, cc_subtitle, cc_description, cc_image_url,
           cc_image_alt, cc_order, cc_is_active, cc_updated_by, cc_updated_at
         )
         VALUES (
           $1::varchar, $2, $3, $4, $5, $6,
           COALESCE($7::integer, (SELECT COALESCE(MAX(cc_order) + 1, 0) FROM content_cards WHERE cc_section = $1::varchar)),
           $8, $9, now()
         )
         RETURNING cc_id AS "id"`,
        [
          params.section,
          params.title,
          params.subtitle,
          params.description,
          params.imageUrl,
          params.imageAlt,
          params.order,
          params.isActive,
          userId,
        ],
      );
      const id = rows[0].id;
      await this.logChange(manager, userId, 'content_card', id, 'create');
      return (await this.findCardById(id, manager)) as ContentCardResponse;
    });
  }

  /**
   * Updates the given fields of a content card.
   * @param id The ID of the card.
   * @param patch The fields to change.
   * @param userId The ID of the user making the change.
   * @returns A promise that resolves to the updated card or null if it does not exist.
   */
  async updateCard(
    id: number,
    patch: ContentCardPatch,
    userId: number,
  ): Promise<ContentCardResponse | null> {
    return this.dataSource.transaction(async (manager) => {
      const assignments: string[] = [];
      const values: unknown[] = [];

      for (const field of Object.keys(CARD_PATCH_COLUMNS) as (keyof ContentCardPatch)[]) {
        if (patch[field] === undefined) continue;
        values.push(patch[field]);
        assignments.push(`${CARD_PATCH_COLUMNS[field]} = $${values.length}`);
      }

      values.push(userId, id);
      const [, affected] = await manager.query<[unknown[], number]>(
        `UPDATE content_cards
         SET ${[...assignments, `cc_updated_by = $${values.length - 1}`, 'cc_updated_at = now()'].join(', ')}
         WHERE cc_id = $${values.length}`,
        values,
      );
      if (affected === 0) return null;

      await this.logChange(manager, userId, 'content_card', id, 'update');
      return this.findCardById(id, manager);
    });
  }

  /**
   * Deletes a content card and records who deleted it.
   * @param id The ID of the card.
   * @param userId The ID of the user deleting the card.
   * @returns A promise that resolves to true if the card was deleted.
   */
  async deleteCard(id: number, userId: number): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      const [, affected] = await manager.query<[unknown[], number]>(
        `DELETE FROM content_cards WHERE cc_id = $1`,
        [id],
      );
      if (affected === 0) return false;

      await this.logChange(manager, userId, 'content_card', id, 'delete');
      return true;
    });
  }

  /**
   * Finds the active cards of every section for the public site.
   * @returns A promise that resolves to the active cards ordered by position.
   */
  async findActiveCards(): Promise<ContentCardResponse[]> {
    const rows = await this.dataSource.query<ContentCardRow[]>(
      `${CARD_SELECT}
       WHERE cc.cc_is_active
       ORDER BY cc.cc_section, cc.cc_order, cc.cc_id`,
    );
    return rows.map(toCardResponse);
  }

  private async logChange(
    manager: EntityManager,
    userId: number,
    contentType: ContentType,
    contentId: number,
    action: ContentAction,
  ): Promise<void> {
    await manager.query(
      `INSERT INTO content_change_log (use_id, ccl_content_type, ccl_content_id, ccl_action)
       VALUES ($1, $2, $3, $4)`,
      [userId, contentType, contentId, action],
    );
  }
}

function toCardResponse(row: ContentCardRow): ContentCardResponse {
  const { editorId, editorName, ...card } = row;
  return { ...card, updatedBy: { id: editorId, name: editorName } };
}

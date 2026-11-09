import { Injectable } from '@nestjs/common';
import { DataSource, type EntityManager } from 'typeorm';
import { logContentChange } from './content-change-log.js';
import {
  CONTENT_ITEM_KEYS,
  type ContentCardSection,
  type ContentItemKey,
  type TeamGroup,
} from './content.constants.js';
import type {
  ContentCardResponse,
  ContentItemResponse,
  PhotoCrop,
} from './dto/content-response.dto.js';

interface ContentCardRow extends Omit<ContentCardResponse, 'updatedBy' | 'photoCrop'> {
  photoCropX: string | null;
  photoCropY: string | null;
  photoCropWidth: string | null;
  photoCropHeight: string | null;
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
  teamGroup: TeamGroup | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  photoCrop: PhotoCrop | null;
}

export type ContentCardPatch = Partial<Omit<ContentCardWriteParams, 'section'>>;

const CARD_PATCH_COLUMNS: Record<Exclude<keyof ContentCardPatch, 'photoCrop'>, string> = {
  title: 'cc_title',
  subtitle: 'cc_subtitle',
  description: 'cc_description',
  imageUrl: 'cc_image_url',
  imageAlt: 'cc_image_alt',
  order: 'cc_order',
  isActive: 'cc_is_active',
  teamGroup: 'cc_team_group',
  facebookUrl: 'cc_facebook_url',
  instagramUrl: 'cc_instagram_url',
  linkedinUrl: 'cc_linkedin_url',
};

const PHOTO_CROP_COLUMNS: Record<keyof PhotoCrop, string> = {
  x: 'cc_photo_crop_x',
  y: 'cc_photo_crop_y',
  width: 'cc_photo_crop_width',
  height: 'cc_photo_crop_height',
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
    cc.cc_team_group AS "teamGroup",
    cc.cc_facebook_url AS "facebookUrl",
    cc.cc_instagram_url AS "instagramUrl",
    cc.cc_linkedin_url AS "linkedinUrl",
    cc.cc_photo_crop_x AS "photoCropX",
    cc.cc_photo_crop_y AS "photoCropY",
    cc.cc_photo_crop_width AS "photoCropWidth",
    cc.cc_photo_crop_height AS "photoCropHeight",
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
        await logContentChange(
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
           cc_image_alt, cc_order, cc_is_active, cc_updated_by, cc_updated_at,
           cc_team_group, cc_facebook_url, cc_instagram_url, cc_linkedin_url,
           cc_photo_crop_x, cc_photo_crop_y, cc_photo_crop_width, cc_photo_crop_height
         )
         VALUES (
           $1::varchar, $2, $3, $4, $5, $6,
           COALESCE($7::integer, (SELECT COALESCE(MAX(cc_order) + 1, 0) FROM content_cards WHERE cc_section = $1::varchar)),
           $8, $9, now(),
           $10, $11, $12, $13, $14, $15, $16, $17
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
          params.teamGroup,
          params.facebookUrl,
          params.instagramUrl,
          params.linkedinUrl,
          params.photoCrop?.x ?? null,
          params.photoCrop?.y ?? null,
          params.photoCrop?.width ?? null,
          params.photoCrop?.height ?? null,
        ],
      );
      const id = rows[0].id;
      await logContentChange(manager, userId, 'content_card', id, 'create');
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

      for (const field of Object.keys(CARD_PATCH_COLUMNS) as (keyof typeof CARD_PATCH_COLUMNS)[]) {
        if (patch[field] === undefined) continue;
        values.push(patch[field]);
        assignments.push(`${CARD_PATCH_COLUMNS[field]} = $${values.length}`);
      }

      if (patch.photoCrop !== undefined) {
        for (const key of Object.keys(PHOTO_CROP_COLUMNS) as (keyof PhotoCrop)[]) {
          values.push(patch.photoCrop?.[key] ?? null);
          assignments.push(`${PHOTO_CROP_COLUMNS[key]} = $${values.length}`);
        }
      }

      values.push(userId, id);
      const [, affected] = await manager.query<[unknown[], number]>(
        `UPDATE content_cards
         SET ${[...assignments, `cc_updated_by = $${values.length - 1}`, 'cc_updated_at = now()'].join(', ')}
         WHERE cc_id = $${values.length}`,
        values,
      );
      if (affected === 0) return null;

      await logContentChange(manager, userId, 'content_card', id, 'update');
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

      await logContentChange(manager, userId, 'content_card', id, 'delete');
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
}

function toCardResponse(row: ContentCardRow): ContentCardResponse {
  const {
    editorId,
    editorName,
    photoCropX,
    photoCropY,
    photoCropWidth,
    photoCropHeight,
    ...card
  } = row;
  const photoCrop =
    photoCropX === null ||
    photoCropY === null ||
    photoCropWidth === null ||
    photoCropHeight === null
      ? null
      : {
          x: Number(photoCropX),
          y: Number(photoCropY),
          width: Number(photoCropWidth),
          height: Number(photoCropHeight),
        };
  return { ...card, photoCrop, updatedBy: { id: editorId, name: editorName } };
}

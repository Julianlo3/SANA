import type { EntityManager } from 'typeorm';
import type { ContentAction, ContentType } from './content.constants.js';

/**
 * Records who changed a piece of content and when. Must run inside the same transaction as the change.
 * @param manager The transactional entity manager.
 * @param userId The ID of the user making the change.
 * @param contentType The table of the changed content.
 * @param contentId The ID of the changed record.
 * @param action The action performed.
 */
export async function logContentChange(
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

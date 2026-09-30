import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { ContentAction, ContentType } from '../content.constants.js';

/**
 * Entity linking users and content: who changed which content and when.
 */
@Entity({ name: 'content_change_log' })
export class ContentChangeLog {
  @PrimaryGeneratedColumn({ name: 'ccl_id' })
  id!: number;

  @Column({ name: 'use_id' })
  userId!: number;

  @Column({ name: 'ccl_content_type', length: 20 })
  contentType!: ContentType;

  @Column({ name: 'ccl_content_id', type: 'integer' })
  contentId!: number;

  @Column({ name: 'ccl_action', length: 15 })
  action!: ContentAction;

  @Column({ name: 'ccl_changed_at', type: 'timestamptz' })
  changedAt!: Date;
}

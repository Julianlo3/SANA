import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { PublicationStatus } from '../content.constants.js';

/**
 * Entity for news published on the public site.
 */
@Entity({ name: 'news' })
export class News {
  @PrimaryGeneratedColumn({ name: 'nw_id' })
  id!: number;

  @Column({ name: 'nw_title', length: 150 })
  title!: string;

  @Column({ name: 'nw_body', type: 'text' })
  body!: string;

  @Column({ name: 'nw_image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl!: string | null;

  @Column({ name: 'nw_image_alt', type: 'varchar', length: 150, nullable: true })
  imageAlt!: string | null;

  @Column({ name: 'nw_status', length: 10 })
  status!: PublicationStatus;

  @Column({ name: 'nw_published_at', type: 'timestamptz' })
  publishedAt!: Date;

  @Column({ name: 'nw_is_pinned', type: 'boolean' })
  isPinned!: boolean;

  @Column({ name: 'nw_created_by' })
  createdBy!: number;

  @Column({ name: 'nw_updated_by' })
  updatedBy!: number;

  @Column({ name: 'nw_updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

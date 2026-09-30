import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { ContentCardSection } from '../content.constants.js';

/**
 * Entity for list-based institutional content: values, team, services and programs.
 */
@Entity({ name: 'content_cards' })
export class ContentCard {
  @PrimaryGeneratedColumn({ name: 'cc_id' })
  id!: number;

  @Column({ name: 'cc_section', length: 20 })
  section!: ContentCardSection;

  @Column({ name: 'cc_title', length: 150 })
  title!: string;

  @Column({ name: 'cc_subtitle', type: 'varchar', length: 150, nullable: true })
  subtitle!: string | null;

  @Column({ name: 'cc_description', type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'cc_image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl!: string | null;

  @Column({ name: 'cc_image_alt', type: 'varchar', length: 150, nullable: true })
  imageAlt!: string | null;

  @Column({ name: 'cc_order', type: 'integer' })
  order!: number;

  @Column({ name: 'cc_is_active', type: 'boolean' })
  isActive!: boolean;

  @Column({ name: 'cc_updated_by' })
  updatedBy!: number;

  @Column({ name: 'cc_updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

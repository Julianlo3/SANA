import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Entity for single-value editable content (texts or images), identified by a stable key.
 */
@Entity({ name: 'content_items' })
export class ContentItem {
  @PrimaryGeneratedColumn({ name: 'ci_id' })
  id!: number;

  @Column({ name: 'ci_key', length: 100 })
  key!: string;

  @Column({ name: 'ci_type', length: 10 })
  type!: 'text' | 'image';

  @Column({ name: 'ci_text_value', type: 'text', nullable: true })
  textValue!: string | null;

  @Column({ name: 'ci_image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl!: string | null;

  @Column({ name: 'ci_image_alt', type: 'varchar', length: 150, nullable: true })
  imageAlt!: string | null;

  @Column({ name: 'mar_id' })
  updatedBy!: number;

  @Column({ name: 'ci_updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

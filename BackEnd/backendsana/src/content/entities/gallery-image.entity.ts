import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { PublicationStatus } from '../content.constants.js';

/**
 * Entity for images shown in the public gallery.
 */
@Entity({ name: 'gallery_images' })
export class GalleryImage {
  @PrimaryGeneratedColumn({ name: 'gi_id' })
  id!: number;

  @Column({ name: 'gi_image_url', length: 500 })
  imageUrl!: string;

  @Column({ name: 'gi_image_alt', length: 150 })
  imageAlt!: string;

  @Column({ name: 'gi_caption', type: 'varchar', length: 200, nullable: true })
  caption!: string | null;

  @Column({ name: 'gi_status', length: 10 })
  status!: PublicationStatus;

  @Column({ name: 'gi_order', type: 'integer' })
  order!: number;

  @Column({ name: 'gi_created_by' })
  createdBy!: number;

  @Column({ name: 'gi_updated_by' })
  updatedBy!: number;

  @Column({ name: 'gi_updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

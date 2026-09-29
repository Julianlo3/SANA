import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Entity for home page banners with a validity period.
 */
@Entity({ name: 'banners' })
export class Banner {
  @PrimaryGeneratedColumn({ name: 'ban_id' })
  id!: number;

  @Column({ name: 'ban_title', length: 120 })
  title!: string;

  @Column({ name: 'ban_image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl!: string | null;

  @Column({ name: 'ban_image_alt', type: 'varchar', length: 150, nullable: true })
  imageAlt!: string | null;

  @Column({ name: 'ban_starts_at', type: 'timestamptz', nullable: true })
  startsAt!: Date | null;

  @Column({ name: 'ban_ends_at', type: 'timestamptz', nullable: true })
  endsAt!: Date | null;

  @Column({ name: 'ban_is_active', type: 'boolean' })
  isActive!: boolean;

  @Column({ name: 'ban_created_by' })
  createdBy!: number;

  @Column({ name: 'ban_updated_by' })
  updatedBy!: number;

  @Column({ name: 'ban_updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

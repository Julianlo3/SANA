import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../modules/auth.module.js';
import { ContentCardsController } from './content-cards.controller.js';
import { ContentItemsController } from './content-items.controller.js';
import { ContentRepository } from './content.repository.js';
import { ContentService } from './content.service.js';
import { ContentCard } from './entities/content-card.entity.js';
import { ContentChangeLog } from './entities/content-change-log.entity.js';
import { ContentItem } from './entities/content-item.entity.js';
import { GalleryImage } from './entities/gallery-image.entity.js';
import { News } from './entities/news.entity.js';
import { GalleryImagesController } from './gallery/gallery-images.controller.js';
import { GalleryRepository } from './gallery/gallery.repository.js';
import { GalleryService } from './gallery/gallery.service.js';
import { PublicGalleryImagesController } from './gallery/public-gallery-images.controller.js';
import { CloudinaryService } from './images/cloudinary.service.js';
import { ImageUploadSignaturesController } from './images/image-upload-signatures.controller.js';
import { NewsController } from './news/news.controller.js';
import { NewsRepository } from './news/news.repository.js';
import { NewsService } from './news/news.service.js';
import { PublicNewsController } from './news/public-news.controller.js';
import { PublicContentController } from './public-content.controller.js';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      ContentItem,
      ContentCard,
      ContentChangeLog,
      News,
      GalleryImage,
    ]),
  ],
  controllers: [
    ContentItemsController,
    ContentCardsController,
    PublicContentController,
    NewsController,
    PublicNewsController,
    GalleryImagesController,
    PublicGalleryImagesController,
    ImageUploadSignaturesController,
  ],
  providers: [
    ContentRepository,
    ContentService,
    NewsRepository,
    NewsService,
    GalleryRepository,
    GalleryService,
    CloudinaryService,
  ],
})
export class ContentModule {}

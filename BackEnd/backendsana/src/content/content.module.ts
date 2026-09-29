import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../modules/auth.module.js';
import { BannersController } from './banners/banners.controller.js';
import { BannersRepository } from './banners/banners.repository.js';
import { BannersService } from './banners/banners.service.js';
import { PublicBannersController } from './banners/public-banners.controller.js';
import { ContentCardsController } from './content-cards.controller.js';
import { ContentItemsController } from './content-items.controller.js';
import { ContentRepository } from './content.repository.js';
import { ContentService } from './content.service.js';
import { Banner } from './entities/banner.entity.js';
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
      Banner,
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
    BannersController,
    PublicBannersController,
    ImageUploadSignaturesController,
  ],
  providers: [
    ContentRepository,
    ContentService,
    NewsRepository,
    NewsService,
    GalleryRepository,
    GalleryService,
    BannersRepository,
    BannersService,
    CloudinaryService,
  ],
})
export class ContentModule {}

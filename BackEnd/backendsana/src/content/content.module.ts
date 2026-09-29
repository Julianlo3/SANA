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
import { PublicContentController } from './public-content.controller.js';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([ContentItem, ContentCard, ContentChangeLog]),
  ],
  controllers: [ContentItemsController, ContentCardsController, PublicContentController],
  providers: [ContentRepository, ContentService],
})
export class ContentModule {}

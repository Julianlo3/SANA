import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../../interfaces/auth.interface.js';
import type { PublicationStatus } from '../content.constants.js';
import { CloudinaryService } from '../images/cloudinary.service.js';
import type {
  CreateNewsDto,
  NewsResponse,
  PublicNews,
  PublicNewsPage,
  PublicNewsQueryDto,
  UpdateNewsDto,
} from './news.dto.js';
import { NewsRepository, type NewsPatch } from './news.repository.js';

const DEFAULT_PAGE_SIZE = 9;
const NOT_FOUND_MESSAGE = 'La noticia no existe';

/**
 * Service with the business rules for news (HU-4.2).
 */
@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);

  constructor(
    private readonly repository: NewsRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Finds every news item for the admin panel.
   * @returns A promise that resolves to the news, including retired ones.
   */
  findAll(): Promise<NewsResponse[]> {
    return this.repository.findAll();
  }

  /**
   * Publishes a news item.
   * @param user The authenticated user publishing it.
   * @param dto The news data.
   * @returns A promise that resolves to the created news item.
   */
  async create(user: AuthenticatedUser, dto: CreateNewsDto): Promise<NewsResponse> {
    const imageUrl = dto.imageUrl ?? null;
    const imageAlt = dto.imageAlt || null;
    await this.ensureImage(imageUrl, imageAlt);

    const news = await this.repository.create(
      { title: dto.title, body: dto.body, imageUrl, imageAlt },
      user.userId,
    );
    this.logger.log(
      `Module:content, Function:createNews, result-success: userId-${user.userId}, newsId-${news.id}`,
    );
    return news;
  }

  /**
   * Edits a news item.
   * @param user The authenticated user making the change.
   * @param id The ID of the news item.
   * @param dto The fields to change.
   * @returns A promise that resolves to the updated news item.
   */
  async update(
    user: AuthenticatedUser,
    id: number,
    dto: UpdateNewsDto,
  ): Promise<NewsResponse> {
    const current = await this.repository.findById(id);
    if (!current) throw new NotFoundException(NOT_FOUND_MESSAGE);

    const patch: NewsPatch = {
      title: dto.title,
      body: dto.body,
      imageUrl: dto.imageUrl,
      imageAlt: dto.imageAlt === undefined ? undefined : dto.imageAlt || null,
    };
    if (patch.imageUrl === null) patch.imageAlt = null;

    const imageUrl = patch.imageUrl === undefined ? current.imageUrl : patch.imageUrl;
    const imageAlt = patch.imageAlt === undefined ? current.imageAlt : patch.imageAlt;
    if (imageUrl && !imageAlt) throw missingImageAlt();
    if (patch.imageUrl && patch.imageUrl !== current.imageUrl) {
      await this.cloudinaryService.ensureValidImage(patch.imageUrl, 'news');
    }

    const news = await this.repository.update(id, patch, user.userId);
    if (!news) throw new NotFoundException(NOT_FOUND_MESSAGE);
    if (current.imageUrl && patch.imageUrl !== undefined && patch.imageUrl !== current.imageUrl) {
      await this.cloudinaryService.deleteImage(current.imageUrl);
    }

    this.logger.log(
      `Module:content, Function:updateNews, result-success: userId-${user.userId}, newsId-${id}`,
    );
    return news;
  }

  /**
   * Publishes or retires a news item. Retired news stay in the admin list.
   * @param user The authenticated user making the change.
   * @param id The ID of the news item.
   * @param status The new status.
   * @returns A promise that resolves to the updated news item.
   */
  async setStatus(
    user: AuthenticatedUser,
    id: number,
    status: PublicationStatus,
  ): Promise<NewsResponse> {
    const news = await this.repository.setStatus(id, status, user.userId);
    if (!news) throw new NotFoundException(NOT_FOUND_MESSAGE);

    this.logger.log(
      `Module:content, Function:setNewsStatus, result-success: userId-${user.userId}, newsId-${id}, status-${status}`,
    );
    return news;
  }

  /**
   * Pins a published news item so it is shown first, or unpins it.
   * @param user The authenticated user making the change.
   * @param id The ID of the news item.
   * @param isPinned Whether the item must be pinned.
   * @returns A promise that resolves to the updated news item.
   */
  async setPinned(
    user: AuthenticatedUser,
    id: number,
    isPinned: boolean,
  ): Promise<NewsResponse> {
    const current = await this.repository.findById(id);
    if (!current) throw new NotFoundException(NOT_FOUND_MESSAGE);
    if (current.status !== 'published') {
      throw new ConflictException({
        error: 'NEWS_NOT_PUBLISHED',
        message: 'Solo se puede fijar una noticia publicada',
      });
    }

    const news = await this.repository.setPinned(id, isPinned, user.userId);
    if (!news) throw new NotFoundException(NOT_FOUND_MESSAGE);

    this.logger.log(
      `Module:content, Function:setNewsPinned, result-success: userId-${user.userId}, newsId-${id}, pinned-${isPinned}`,
    );
    return news;
  }

  /**
   * Permanently deletes a news item. It must be retired first.
   * @param user The authenticated user deleting it.
   * @param id The ID of the news item.
   */
  async delete(user: AuthenticatedUser, id: number): Promise<void> {
    const current = await this.repository.findById(id);
    if (!current) throw new NotFoundException(NOT_FOUND_MESSAGE);
    if (current.status !== 'retired') throw mustRetireFirst();

    const wasDeleted = await this.repository.deleteRetired(id, user.userId);
    if (!wasDeleted) throw mustRetireFirst();
    if (current.imageUrl) await this.cloudinaryService.deleteImage(current.imageUrl);

    this.logger.log(
      `Module:content, Function:deleteNews, result-success: userId-${user.userId}, newsId-${id}`,
    );
  }

  /**
   * Finds a page of published news for the public site.
   * @param query The page and page size.
   * @returns A promise that resolves to the page of news.
   */
  async findPublished(query: PublicNewsQueryDto): Promise<PublicNewsPage> {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;
    const { items, total } = await this.repository.findPublished(limit, (page - 1) * limit);
    return { items, total, page, limit };
  }

  /**
   * Finds a published news item for the public site.
   * @param id The ID of the news item.
   * @returns A promise that resolves to the news item.
   */
  async findPublishedById(id: number): Promise<PublicNews> {
    const news = await this.repository.findPublishedById(id);
    if (!news) throw new NotFoundException(NOT_FOUND_MESSAGE);
    return news;
  }

  private async ensureImage(imageUrl: string | null, imageAlt: string | null): Promise<void> {
    if (!imageUrl) return;
    if (!imageAlt) throw missingImageAlt();
    await this.cloudinaryService.ensureValidImage(imageUrl, 'news');
  }
}

function mustRetireFirst(): ConflictException {
  return new ConflictException({
    error: 'NEWS_NOT_RETIRED',
    message: 'Retira la noticia del sitio antes de eliminarla',
  });
}

function missingImageAlt(): UnprocessableEntityException {
  return new UnprocessableEntityException({
    error: 'MISSING_REQUIRED_FIELDS',
    message: 'Faltan campos obligatorios: descripción de la imagen',
    fields: ['imageAlt'],
  });
}
